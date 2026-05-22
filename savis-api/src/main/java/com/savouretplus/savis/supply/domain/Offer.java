package com.savouretplus.savis.supply.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;

public record Offer(
        UUID publicId,
        String externalId,
        String componentName,
        String brand,
        String label,
        Money price,
        Quantity packageSize,
        Provider provider,
        LocalDateTime lastSeen,
        OfferStatus status) {

    public Offer unavailable() {
        return new Offer(
                publicId,
                externalId,
                componentName,
                brand,
                label,
                price,
                packageSize,
                provider,
                lastSeen,
                OfferStatus.UNAVAILABLE);
    }
}
