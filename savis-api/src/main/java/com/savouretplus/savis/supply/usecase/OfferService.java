package com.savouretplus.savis.supply.usecase;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.supply.api.OfferPricing;
import com.savouretplus.savis.supply.api.SupplyApi;
import com.savouretplus.savis.supply.domain.Offer;
import com.savouretplus.savis.supply.port.OfferRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
public class OfferService implements SupplyApi {

    private final OfferRepository repository;

    public OfferService(OfferRepository repository) {
        this.repository = repository;
    }

    public void processOffers(List<Offer> offers) {
        log.info("Process offers {}", offers);

        offers.forEach(repository::save);
    }

    public List<Offer> searchAvailableOffers(String componentName) {
        log.info("Search available offers for component {}", componentName);
        return repository.searchAvailableByComponentName(componentName);
    }

    public void invalidateOffer(UUID offerUuid) {
        log.info("Invalidate offer {}", offerUuid);
        repository.findByPublicId(offerUuid)
                .map(Offer::unavailable)
                .ifPresent(repository::save);
    }

    @Override
    public Optional<OfferPricing> getOfferPricing(UUID offerId) {
        return repository.findByPublicId(offerId)
                .map(OfferPricing::from);
    }

    @Override
    public Optional<OfferPricing> getCheapestOfferPricing(String componentName, Quantity quantity) {
        return searchAvailableOffers(componentName).stream()
                .filter(this::hasPricedPackage)
                .filter(offer -> quantity.isCompatibleWith(offer.packageSize()))
                .min(Comparator.comparing(this::baseUnitPrice))
                .map(OfferPricing::from);
    }

    @Override
    public Optional<Money> getPriceFor(String componentName, UUID offerId) {
        return getOfferPricing(offerId).map(OfferPricing::price);
    }

    @Override
    public Money getCheapestPrice(String componentName) {
        return searchAvailableOffers(componentName).stream()
                .filter(this::hasPricedPackage)
                .min(Comparator.comparing(this::baseUnitPrice))
                .map(Offer::price)
                .orElse(Money.ZERO);
    }

    @Override
    public List<Offer> searchOffers(String componentName) {
        return searchAvailableOffers(componentName);
    }

    private BigDecimal baseUnitPrice(Offer offer) {
        return offer.price().amount().divide(offer.packageSize().baseValue(), 10, RoundingMode.HALF_UP);
    }

    private boolean hasPricedPackage(Offer offer) {
        return offer.price() != null
                && offer.packageSize() != null
                && offer.packageSize().baseValue().compareTo(BigDecimal.ZERO) > 0;
    }

}
