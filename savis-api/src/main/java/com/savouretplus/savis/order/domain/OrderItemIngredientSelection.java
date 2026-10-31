package com.savouretplus.savis.order.domain;

/**
 * Represents a snapshot of an ingredient quantity selected by the customer.
 */
public record OrderItemIngredientSelection(
        Long id,
        String ingredientId,
        String ingredientName,
        int quantity,
        int defaultQuantity,
        int extraPriceCents) {
}
