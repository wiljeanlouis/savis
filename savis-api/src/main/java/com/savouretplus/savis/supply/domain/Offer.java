package com.savouretplus.savis.supply.domain;

import java.math.RoundingMode;
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
        OfferStatus status,
        UUID resourceId) {

    /** Discovered provider offers await explicit resource association. */
    public Offer(UUID publicId, String externalId, String url, String componentName, String brand,
            String label, String imageUrl, Money price, Quantity packageSize, Provider provider,
            LocalDateTime lastSeen, OfferStatus status) {
        this(publicId, externalId, url, componentName, brand, label, imageUrl, price, packageSize,
                provider, lastSeen, status, null);
    }

    public Offer associatedWith(UUID resourceId) {
        return new Offer(publicId, externalId, url, componentName, brand, label, imageUrl, price,
                packageSize, provider, lastSeen, status, resourceId);
    }

    /** Validates supplier prices persisted as amounts billed to the cent. */
    public Offer {
        if (price != null) {
            if (price.amount().signum() < 0) {
                throw new IllegalArgumentException("Le prix fournisseur ne peut pas être négatif");
            }
            try {
                price.amount().setScale(2, RoundingMode.UNNECESSARY);
            } catch (ArithmeticException exception) {
                throw new IllegalArgumentException(
                        "Le prix fournisseur doit être représentable exactement au cent", exception);
            }
        }
    }

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
                OfferStatus.UNAVAILABLE, resourceId);
    }
}
