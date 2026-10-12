package com.savouretplus.savis.supply.api;

import java.time.LocalDateTime;
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
        Quantity packageSize,
        String componentName,
        String imageUrl,
        String supplierName,
        LocalDateTime observedAt) {

    /**
     * Creates pricing data when only the historical pricing fields are available.
     */
    public OfferPricing(
            UUID publicId,
            String brand,
            String label,
            Money price,
            Quantity packageSize) {
        this(publicId, brand, label, price, packageSize, null, null, null, null);
    }

    /**
     * Creates a DTO or API value from the provided domain object.
     */
    public static OfferPricing from(Offer offer) {
        /**
         * Creates a offer pricing instance.
         */
        return new OfferPricing(
                offer.publicId(),
                offer.brand(),
                offer.label(),
                offer.price(),
                offer.packageSize(),
                offer.componentName(),
                offer.imageUrl(),
                offer.provider() != null ? offer.provider().name() : null,
                offer.lastSeen());
    }
}
