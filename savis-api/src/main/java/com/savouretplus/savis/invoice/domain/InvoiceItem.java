package com.savouretplus.savis.invoice.domain;

import java.util.List;
import java.util.UUID;

/** Represents an immutable priced order-line snapshot on an invoice. */
public record InvoiceItem(
        UUID publicId,
        UUID sourceOrderItemId,
        UUID productId,
        String productName,
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

    /** Validates the financial and configuration snapshot. */
    public InvoiceItem {
        publicId = publicId != null ? publicId : UUID.randomUUID();
        if (sourceOrderItemId == null || productId == null || productName == null || productName.isBlank()) {
            throw new IllegalArgumentException("La ligne de commande facturée est requise");
        }
        if (productType == null || productType.isBlank() || quantity <= 0) {
            throw new IllegalArgumentException("Le type et la quantité de la ligne facturée sont requis");
        }
        if (basePriceCents < 0 || unitPriceCents < 0 || lineTotalCents < 0) {
            throw new IllegalArgumentException("Les montants d'une ligne facturée ne peuvent pas être négatifs");
        }
        int expected;
        try {
            expected = Math.multiplyExact(unitPriceCents, quantity);
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("Le total de la ligne facturée dépasse la limite permise", exception);
        }
        if (lineTotalCents != expected) {
            throw new IllegalArgumentException("Le total de la ligne facturée est incohérent");
        }
        allocationType = allocationType == null || allocationType.isBlank() ? "NONE" : allocationType;
        choices = choices != null ? List.copyOf(choices) : List.of();
        allocations = allocations != null ? List.copyOf(allocations) : List.of();
        ingredients = ingredients != null ? List.copyOf(ingredients) : List.of();
    }

    /** Represents a selected product choice. */
    public record Choice(String id, String name, String groupLabel) {
    }

    /** Represents an allocated product choice. */
    public record Allocation(String id, String name, int quantity) {
    }

    /** Represents a selected ingredient. */
    public record Ingredient(String id, String name, int quantity, int defaultQuantity, int extraPriceCents) {
    }
}
