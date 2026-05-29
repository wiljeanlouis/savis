package com.savouretplus.savis.supply.api;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.supply.domain.Offer;

public interface SupplyApi {
    Optional<OfferPricing> getOfferPricing(UUID offerId);

    Optional<OfferPricing> getCheapestOfferPricing(String componentName, Quantity quantity);

    Optional<Money> getPriceFor(String componentName, UUID offerId);

    Money getCheapestPrice(String componentName);

    List<Offer> searchOffers(String componentName);
}
