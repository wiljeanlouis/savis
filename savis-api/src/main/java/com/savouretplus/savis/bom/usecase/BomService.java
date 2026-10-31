package com.savouretplus.savis.bom.usecase;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.bom.api.BomPricingApi;
import com.savouretplus.savis.bom.api.BomRequirementsApi;
import com.savouretplus.savis.bom.domain.ActivityRate;
import com.savouretplus.savis.bom.domain.ActivityType;
import com.savouretplus.savis.bom.domain.Bom;
import com.savouretplus.savis.bom.domain.BomCost;
import com.savouretplus.savis.bom.domain.BomComponent;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.resource.api.ResourceCatalogApi;
import com.savouretplus.savis.resource.api.ResourceCatalogApi.ResourceReference;
import com.savouretplus.savis.bom.port.ActivityRateRepositoryPort;
import com.savouretplus.savis.bom.port.BomRepositoryPort;
import com.savouretplus.savis.bom.port.ComponentPricePort;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * Coordinates BOM lifecycle operations and cost calculations.
 */
@Slf4j
@Service
@Transactional
public class BomService implements BomPricingApi, BomRequirementsApi {

    private final BomRepositoryPort repository;
    private final ComponentPricePort priceCalculator;
    private final ActivityRateRepositoryPort activityRateRepository;
    private final ResourceCatalogApi resourceCatalogApi;

    @Autowired
    public BomService(BomRepositoryPort repository, ComponentPricePort priceCalculator,
            ActivityRateRepositoryPort activityRateRepository,
            ResourceCatalogApi resourceCatalogApi) {
        this.repository = repository;
        this.priceCalculator = priceCalculator;
        this.activityRateRepository = activityRateRepository;
        this.resourceCatalogApi = resourceCatalogApi;
    }

    /** Keeps isolated pricing tests independent from the Resource module. */
    public BomService(BomRepositoryPort repository, ComponentPricePort priceCalculator,
            ActivityRateRepositoryPort activityRateRepository) {
        this(repository, priceCalculator, activityRateRepository, null);
    }

    /**
     * Creates or replaces a BOM using the supplied identifier.
     */
    public UUID saveBom(UUID bomId, Bom bom) {
        log.info("Save bom {} with id : {}", bom, bomId);

        Bom resolvedBom = resolveResourcesForSave(bomId, bom);

        repository.save(resolvedBom);

        return resolvedBom.getPublicId();
    }

    private Bom resolveResourcesForSave(UUID bomId, Bom submitted) {
        if (resourceCatalogApi == null) return submitted;
        List<BomComponent> previous = bomId == null ? List.of()
                : repository.findByPublicId(bomId).map(Bom::components).orElse(List.of());
        List<BomComponent> components = submitted.components().stream().map(component -> {
            ResourceReference resource = component.resourceId() == null ? null
                    : resourceCatalogApi.findReference(component.resourceId()).orElse(null);
            if (resource == null) {
                throw new IllegalArgumentException("La ressource sélectionnée est introuvable");
            }
            boolean unchangedExistingReference = component.id() != null && previous.stream().anyMatch(existing ->
                    component.id().equals(existing.id()) && component.resourceId().equals(existing.resourceId()));
            if (!"ACTIVE".equals(resource.status()) && !unchangedExistingReference) {
                throw new IllegalArgumentException("Une ressource inactive ne peut pas être ajoutée à une composition");
            }
            if (resource.referenceUnit() != null) {
                Unit referenceUnit = Unit.fromSymbole(resource.referenceUnit());
                if (!referenceUnit.baseUnit().equals(component.quantity().unit().baseUnit())) {
                    throw new IllegalArgumentException("L'unité du composant est incompatible avec celle de la ressource");
                }
            }
            String supplyNameSnapshot = unchangedExistingReference
                    ? previous.stream().filter(existing -> component.id().equals(existing.id())).findFirst()
                            .map(BomComponent::resourceName).orElse(resource.name())
                    : resource.name();
            return new BomComponent(component.id(), resource.id(), supplyNameSnapshot, component.quantity(),
                    component.selectedOfferId());
        }).toList();
        return new Bom(submitted.getPublicId(), submitted.getName(), submitted.getDescription(), submitted.getImageUrl(),
                submitted.getInstructions(), submitted.getType(), components, submitted.activities(), submitted.getYield());
    }

    /**
     * Returns a BOM by identifier.
     */
    public Bom getBom(UUID bomId) {
        return repository.findByPublicId(bomId)
                .orElseThrow(() -> new RuntimeException("Bom not found"));
    }

    /**
     * Deletes a BOM by identifier.
     */
    public void deleteBom(UUID bomId) {
        Bom bom = getBom(bomId);
        repository.delete(bom);
    }

    /**
     * Lists all BOMs.
     */
    public List<Bom> listBoms() {
        return repository.findAll();
    }

    /**
     * Calculates the total cost for a BOM.
     */
    public BomCost calculateTotalCost(UUID bomId) {
        Bom bom = getBom(bomId);
        /**
         * Calculates the total cost for the supplied bill of materials or identifier.
         */
        return calculateTotalCost(bom);
    }

    /**
     * Calculates the total cost for a BOM.
     */
    public BomCost calculateTotalCost(Bom bom) {
        return bom.calculateCost(
                priceCalculator.getPrices(bom.componentPriceRequests()),
                activityRatesByType());
    }

    /**
     * Checks whether a BOM exists.
     */
    @Override
    public boolean existsBom(UUID bomId) {
        return bomId != null && repository.findByPublicId(bomId).isPresent();
    }

    /**
     * Returns the calculated pricing for a BOM.
     */
    @Override
    public BomPricing getBomPricing(UUID bomId) {
        return repository.findByPublicId(bomId)
                .map(bom -> BomPricingMapper.from(calculateTotalCost(bom)))
                .orElseGet(() -> new BomPricing(null, null, Money.ZERO, Money.ZERO, Money.ZERO,
                        false, List.of(), List.of(), List.of(new BomPricingApi.Diagnostic(
                                "BOM_NOT_FOUND", String.valueOf(bomId), "Composition introuvable", true))));
    }

    /**
     * Explodes a BOM and scales every component to the requested output quantity.
     */
    @Override
    public BomRequirements getRequirements(UUID bomId, BigDecimal outputQuantity) {
        if (outputQuantity == null || outputQuantity.signum() <= 0) {
            throw new IllegalArgumentException("La quantité de production BOM doit être supérieure à zéro");
        }

        Bom bom = getBom(bomId);
        BigDecimal yieldQuantity = BigDecimal.valueOf(bom.getYield().quantity().value());
        if (yieldQuantity.signum() <= 0) {
            throw new IllegalStateException("Le rendement du BOM doit être supérieur à zéro");
        }

        BigDecimal factor = outputQuantity.divide(yieldQuantity, 12, RoundingMode.HALF_UP);
        return new BomRequirements(
                bom.getPublicId(),
                bom.getName(),
                bom.components().stream()
                        .map(component -> new ComponentRequirement(
                                component.componentName(),
                                BigDecimal.valueOf(component.quantity().value())
                                        .multiply(factor)
                                        .stripTrailingZeros(),
                                component.quantity().unit(),
                                component.selectedOfferId()))
                        .toList());
    }

    private Map<ActivityType, Money> activityRatesByType() {
        return activityRateRepository.findAll().stream()
                .collect(Collectors.toMap(
                        ActivityRate::activityType,
                        ActivityRate::hourlyRate));
    }

}
