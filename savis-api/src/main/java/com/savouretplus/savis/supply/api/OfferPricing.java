package com.savouretplus.savis.supply.api;

import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.supply.domain.Offer;

/**
 * Represents the pricing data exposed by supply offers to other modules.
 */
public record OfferPricing(
        UUID publicId,
        String brand,
        String label,
        Money price,
        Quantity packageSize) {

    /**
     * Creates a DTO or API value from the provided domain object.
     */
    public static OfferPricing from(Offer offer) {
        /**
         * Creates a offer pricing instance.
         */
        return new OfferPricing(offer.publicId(), offer.brand(), offer.label(), offer.price(), offer.packageSize());
    }
}
