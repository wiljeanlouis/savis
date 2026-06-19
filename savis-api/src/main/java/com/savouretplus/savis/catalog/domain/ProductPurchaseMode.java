package com.savouretplus.savis.catalog.domain;

import java.util.UUID;

import com.savouretplus.savis.common.Money;

/**
 * Represents one available purchase mode for a catalog product.
 *
 * Ex:
 *  unity
 *  À l'unité
 *  quantity = 1
 *  price = 3
 *  allocationType = SINGLE_CHOICE
 *
 *  douzen
 *  Douzaine
 *  quantity = 12
 *  price = 30
 *  allocationType = CHOICE_ALLOCATION
 *
 */
public record ProductPurchaseMode(
        UUID publicId,
        String code,
        String label,
        int quantity,
        Money price,
        AllocationType allocationType,
        boolean active,
        int displayOrder) {

    /**
     * Validates a purchase mode and its price allocation settings.
     */
    public ProductPurchaseMode {
        publicId = publicId != null ? publicId : UUID.randomUUID();
        requireText(code, "Le code du mode d'achat est requis");
        requireText(label, "Le libellé du mode d'achat est requis");
        if (quantity <= 0) {
            throw new IllegalArgumentException("La quantité du mode d'achat doit être supérieure à zéro");
        }
        if (price == null || price.amount().signum() < 0) {
            throw new IllegalArgumentException("Le prix du mode d'achat est requis et ne peut pas être négatif");
        }
        allocationType = allocationType != null ? allocationType : AllocationType.NONE;
        if (displayOrder < 0) {
            throw new IllegalArgumentException("L'ordre d'affichage ne peut pas être négatif");
        }
    }

    private static void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }
}
