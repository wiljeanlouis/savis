package com.savouretplus.savis.order.domain;

import java.util.List;
import java.util.UUID;

/**
 * Represents an immutable product and configuration snapshot within an order.
 */
public record OrderItem(
        Long id,
        UUID publicId,
        UUID productId,
        String productNameSnapshot,
        OrderItemProductType productType,
        String imageUrl,
        int quantity,
        int basePriceCents,
        int unitPriceCents,
        int lineTotalCents,
        String purchaseModeId,
        String purchaseModeLabel,
        Integer purchaseModeQuantity,
        OrderItemAllocationType allocationType,
        String rawKey,
        List<OrderItemChoiceSelection> choiceSelections,
        List<OrderItemChoiceAllocation> choiceAllocations,
        List<OrderItemIngredientSelection> ingredientSelections) {

    /**
     * Validates required product data and normalizes configuration collections.
     */
    public OrderItem {
        publicId = publicId != null ? publicId : UUID.randomUUID();
        if (productId == null) {
            throw new IllegalArgumentException("L'identifiant du produit commandé est requis");
        }
        if (productNameSnapshot == null || productNameSnapshot.isBlank()) {
            throw new IllegalArgumentException("Le nom du produit commandé est requis");
        }
        if (productType == null || quantity <= 0) {
            throw new IllegalArgumentException("Le type et la quantité du produit commandé sont requis");
        }
        if (basePriceCents < 0 || unitPriceCents < 0 || lineTotalCents < 0) {
            throw new IllegalArgumentException("Les prix d'un item ne peuvent pas être négatifs");
        }
        allocationType = allocationType != null ? allocationType : OrderItemAllocationType.NONE;
        choiceSelections = choiceSelections != null ? List.copyOf(choiceSelections) : List.of();
        choiceAllocations = choiceAllocations != null ? List.copyOf(choiceAllocations) : List.of();
        ingredientSelections = ingredientSelections != null ? List.copyOf(ingredientSelections) : List.of();
    }
}
