package com.savouretplus.savis.supply.usecase;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.resource.api.ResourceCatalogApi;
import com.savouretplus.savis.supply.api.OfferPricing;
import com.savouretplus.savis.supply.api.SupplyApi;
import com.savouretplus.savis.supply.domain.Offer;
import com.savouretplus.savis.supply.port.OfferCatalogPage;
import com.savouretplus.savis.supply.port.OfferCatalogQuery;
import com.savouretplus.savis.supply.port.OfferRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Coordinates offer ingestion, invalidation, searching, and pricing lookup.
 */
@Slf4j
@Service
@Transactional
public class OfferService implements SupplyApi {

    private final OfferRepository repository;

    private final ResourceCatalogApi resources;

    public OfferService(OfferRepository repository,
            ResourceCatalogApi resources) {
        this.repository = repository;
        this.resources = resources;
    }

    @Override
    public List<OfferPricing> getPricingCandidates(Set<UUID> resourceIds, Set<UUID> offerIds) {
        return repository.findPricingCandidates(resourceIds, offerIds).stream().map(OfferPricing::from).toList();
    }

    public List<Offer> resourceOffers(UUID resourceId) {
        return repository.findByResourceId(resourceId);
    }

    public Offer associate(UUID offerId, UUID resourceId) {
        Offer offer = repository.findByPublicId(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offre introuvable"));
        validateAssociation(offer, resourceId);
        return repository.save(offer.associatedWith(resourceId));
    }

    public Offer createManualOffer(Offer offer) {
        if (offer.externalId() == null || offer.externalId().isBlank()
                || offer.provider() == null || offer.provider().identifier() == null
                || offer.provider().identifier().isBlank() || offer.provider().name() == null
                || offer.provider().name().isBlank() || offer.price() == null
                || offer.packageSize() == null || !Double.isFinite(offer.packageSize().value())
                || offer.packageSize().value() <= 0) {
            throw new IllegalArgumentException("Fournisseur, référence, prix et conditionnement positif requis");
        }
        if (repository.findByExternalIdAndProviderIdentifier(offer.externalId(), offer.provider().identifier()).isPresent()) {
            throw new IllegalArgumentException("Cette référence fournisseur existe déjà");
        }
        validateAssociation(offer, offer.resourceId());
        return repository.save(offer);
    }

    private void validateAssociation(Offer offer, UUID resourceId) {
        if (resourceId == null) throw new IllegalArgumentException("La ressource est requise");
        var resource = resources.findReference(resourceId)
                .orElseThrow(() -> new IllegalArgumentException("Ressource introuvable"));
        if (!"ACTIVE".equals(resource.status())) throw new IllegalArgumentException("La ressource est inactive");
        if (offer.packageSize() == null || resource.referenceUnit() == null
                || !offer.packageSize().unit().baseUnit().equals(
                        Unit.fromSymbole(resource.referenceUnit()).baseUnit())) {
            throw new IllegalArgumentException("Unités de la ressource et du conditionnement incompatibles");
        }
    }

    /**
     * Stores the received supplier offers.
     */
    public void processOffers(List<Offer> offers) {
        log.info("Process offers {}", offers);

        offers.forEach(repository::save);
    }

    /**
     * Finds currently available supplier offers for a component name.
     */
    public List<Offer> searchAvailableOffers(String componentName) {
        log.info("Search available offers for component {}", componentName);
        return repository.searchAvailableByComponentName(componentName);
    }

    /**
     * Returns one filtered page of persisted supplier offers.
     */
    @Transactional(readOnly = true)
    public OfferCatalogPage searchOfferCatalog(OfferCatalogQuery query) {
        return repository.searchCatalog(query);
    }

    /**
     * Marks an offer as unavailable when it exists.
     */
    public void invalidateOffer(UUID offerUuid) {
        log.info("Invalidate offer {}", offerUuid);
        repository.findByPublicId(offerUuid)
                .map(Offer::unavailable)
                .ifPresent(repository::save);
    }

    /**
     * Returns pricing information for a specific supplier offer.
     */
    @Override
    public Optional<OfferPricing> getOfferPricing(UUID offerId) {
        return repository.findByPublicId(offerId)
                .map(OfferPricing::from);
    }

    /**
     * Returns the cheapest compatible supplier offer for a component quantity.
     */
    @Override
    public Optional<OfferPricing> getCheapestOfferPricing(String componentName, Quantity quantity) {
        return searchAvailableOffers(componentName).stream()
                .filter(this::hasPricedPackage)
                .filter(offer -> quantity.isCompatibleWith(offer.packageSize()))
                .min(Comparator.comparing(this::baseUnitPrice))
                .map(OfferPricing::from);
    }

    /**
     * Returns the price of a specific supplier offer.
     */
    @Override
    public Optional<Money> getPriceFor(String componentName, UUID offerId) {
        return getOfferPricing(offerId).map(OfferPricing::price);
    }

    /**
     * Returns the cheapest available price for a component.
     */
    @Override
    public Money getCheapestPrice(String componentName) {
        return searchAvailableOffers(componentName).stream()
                .filter(this::hasPricedPackage)
                .min(Comparator.comparing(this::baseUnitPrice))
                .map(Offer::price)
                .orElse(Money.ZERO);
    }

    /**
     * Searches supplier offers for a component name.
     */
    @Override
    public List<Offer> searchOffers(String componentName) {
        return searchAvailableOffers(componentName);
    }

    /**
     * Calculates an offer price normalized to one base unit.
     */
    private BigDecimal baseUnitPrice(Offer offer) {
        return offer.price().amount().divide(offer.packageSize().baseValue(), 10, RoundingMode.HALF_UP);
    }

    /**
     * Checks that an offer has usable price and package-size data.
     */
    private boolean hasPricedPackage(Offer offer) {
        return offer.price() != null
                && offer.packageSize() != null
                && offer.packageSize().unit() != null
                && Double.isFinite(offer.packageSize().value())
                && offer.packageSize().value() > 0;
    }

}
