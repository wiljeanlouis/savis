package com.savouretplus.savis.supply.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;

/**
 * Represents a supplier offer for a purchasable component.
 */
public record Offer(
        UUID publicId,
        String externalId,
        String url,
        String componentName,
        String brand,
        String label,
        String imageUrl,
        Money price,
        Quantity packageSize,
        Provider provider,
        LocalDateTime lastSeen,
        OfferStatus status) {

    /**
     * Returns a copy of this offer marked as unavailable.
     */
    public Offer unavailable() {
        return new Offer(
                publicId,
                externalId,
                url,
                componentName,
                brand,
                label,
                imageUrl,
                price,
                packageSize,
                provider,
                lastSeen,
                OfferStatus.UNAVAILABLE);
    }
}
