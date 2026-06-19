package com.savouretplus.savis.catalog.domain;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Links a catalog product to the BOM used to calculate its cost.
 */
public record ProductBom(
        UUID publicId,
        UUID bomId,
        BigDecimal quantity,
        int displayOrder) {

    /**
     * Validates a product-to-BOM link and its display order.
     */
    public ProductBom {
        publicId = publicId != null ? publicId : UUID.randomUUID();
        if (bomId == null) {
            throw new IllegalArgumentException("Le BOM du produit est requis");
        }
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("La quantité du BOM produit doit être supérieure à zéro");
        }
        if (displayOrder < 0) {
            throw new IllegalArgumentException("L'ordre d'affichage ne peut pas être négatif");
        }
    }
}
