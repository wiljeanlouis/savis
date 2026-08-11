package com.savouretplus.savis.order.usecase;

import java.util.List;
import java.util.UUID;

/**
 * Describes an administrative order to create from current catalog products.
 */
public record CreateOrderCommand(
        String customerName,
        String customerPhone,
        String customerEmail,
        String note,
        List<Item> items) {

    /**
     * Normalizes the selected order-item collection.
     */
    public CreateOrderCommand {
        items = items != null ? List.copyOf(items) : List.of();
    }

    /**
     * Describes one configured catalog product and ordered quantity.
     */
    public record Item(
            UUID productId,
            int quantity,
            String purchaseModeCode,
            String choiceCode,
            List<ChoiceAllocation> allocations,
            List<IngredientSelection> ingredients) {

        /**
         * Normalizes optional product-configuration collections.
         */
        public Item {
            allocations = allocations != null ? List.copyOf(allocations) : List.of();
            ingredients = ingredients != null ? List.copyOf(ingredients) : List.of();
        }
    }

    /**
     * Represents one selected choice allocation.
     */
    public record ChoiceAllocation(String choiceCode, int quantity) {
    }

    /**
     * Represents one selected ingredient quantity.
     */
    public record IngredientSelection(String ingredientCode, int quantity) {
    }
}
