package com.savouretplus.savis.supply.api;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.supply.domain.Offer;

/**
 * Exposes supplier offer pricing and search operations to other modules.
 */
public interface SupplyApi {
    /**
     * Returns pricing information for a specific supplier offer.
     */
    Optional<OfferPricing> getOfferPricing(UUID offerId);

    /**
     * Returns the cheapest compatible supplier offer for a component quantity.
     */
    Optional<OfferPricing> getCheapestOfferPricing(String componentName, Quantity quantity);

    /**
     * Returns the price of a specific supplier offer.
     */
    Optional<Money> getPriceFor(String componentName, UUID offerId);

    /**
     * Returns the cheapest available price for a component.
     */
    Money getCheapestPrice(String componentName);

    /**
     * Searches supplier offers for a component name.
     */
    List<Offer> searchOffers(String componentName);
}
