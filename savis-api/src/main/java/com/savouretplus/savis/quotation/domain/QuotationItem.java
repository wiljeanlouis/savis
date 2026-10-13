package com.savouretplus.savis.quotation.domain;

import java.util.List;
import java.util.UUID;

/**
 * Represents an immutable priced catalog-product snapshot on a quotation.
 */
public record QuotationItem(
        UUID publicId,
        UUID productId,
        String productName,
        String commercialType,
        String productType,
        String imageUrl,
        int quantity,
        int basePriceCents,
        int unitPriceCents,
        int lineTotalCents,
        String purchaseModeId,
        String purchaseModeLabel,
        Integer purchaseModeQuantity,
        String allocationType,
        List<Choice> choices,
        List<Allocation> allocations,
        List<Ingredient> ingredients) {

    /** Validates and normalizes an item snapshot. */
    public QuotationItem {
        publicId = publicId != null ? publicId : UUID.randomUUID();
        if (productId == null || productName == null || productName.isBlank()) {
            throw new IllegalArgumentException("Le produit de la soumission est requis");
        }
        if (commercialType == null || productType == null || quantity <= 0) {
            throw new IllegalArgumentException("La nature, la configuration et la quantité sont requises");
        }
        if (basePriceCents < 0 || unitPriceCents < 0 || lineTotalCents < 0) {
            throw new IllegalArgumentException("Les prix de la soumission ne peuvent pas être négatifs");
        }
        choices = choices != null ? List.copyOf(choices) : List.of();
        allocations = allocations != null ? List.copyOf(allocations) : List.of();
        ingredients = ingredients != null ? List.copyOf(ingredients) : List.of();
    }

    /** Represents a selected choice snapshot. */
    public record Choice(String id, String name, String groupLabel) {
    }

    /** Represents an allocated choice snapshot. */
    public record Allocation(String id, String name, int quantity) {
    }

    /** Represents a selected ingredient snapshot. */
    public record Ingredient(String id, String name, int quantity, int defaultQuantity, int extraPriceCents) {
    }
}
