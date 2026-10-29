package com.savouretplus.savis.bom.usecase;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.bom.api.BomPricingApi;
import com.savouretplus.savis.bom.api.BomRequirementsApi;
import com.savouretplus.savis.bom.domain.ActivityRate;
import com.savouretplus.savis.bom.domain.ActivityType;
import com.savouretplus.savis.bom.domain.ComponentNeededEvent;
import com.savouretplus.savis.bom.domain.Bom;
import com.savouretplus.savis.bom.domain.BomCost;
import com.savouretplus.savis.bom.port.ComponentPrice;
import com.savouretplus.savis.bom.port.ActivityRateRepositoryPort;
import com.savouretplus.savis.bom.port.BomRepositoryPort;
import com.savouretplus.savis.bom.port.ComponentNeededEventPort;
import com.savouretplus.savis.bom.port.ComponentPricePort;
import com.savouretplus.savis.bom.port.ComponentPriceRequest;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Coordinates BOM lifecycle operations and cost calculations.
 */
@Slf4j
@Service
@Transactional
@AllArgsConstructor
public class BomService implements BomPricingApi, BomRequirementsApi {

    private final BomRepositoryPort repository;
    private final ComponentPricePort priceCalculator;
    private final ActivityRateRepositoryPort activityRateRepository;
    private final ComponentNeededEventPort componentNeededEventPublisher;

    /**
     * Creates or replaces a BOM using the supplied identifier.
     */
    public UUID saveBom(UUID bomId, Bom bom) {
        log.info("Save bom {} with id : {}", bom, bomId);

        repository.save(bom);
        publishComponentNeededEvents(bom);

        return bom.getPublicId();
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
     * Calculates total costs for several BOMs in one pass.
     */
    public Map<UUID, BomCost> calculateTotalCosts(List<Bom> boms) {
        List<ComponentPriceRequest> requests = boms.stream()
                .flatMap(bom -> bom.componentPriceRequests().stream())
                .distinct()
                .toList();

        Map<ComponentPriceRequest, ComponentPrice> componentPrices = priceCalculator.getPrices(requests);
        Map<ActivityType, Money> activityRates = activityRatesByType();

        return boms.stream()
                .collect(Collectors.toMap(
                        Bom::getPublicId,
                        bom -> bom.calculateCost(componentPrices, activityRates)));
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

    private void publishComponentNeededEvents(Bom bom) {
        bom.getComponents().forEach(component -> {
            if (component.selectedOfferId() == null) {
                componentNeededEventPublisher
                        .publish(ComponentNeededEvent.of(component.componentName(), bom.getType()));

            }
        });
    }

}
