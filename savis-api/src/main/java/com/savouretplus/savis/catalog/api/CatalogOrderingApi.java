package com.savouretplus.savis.catalog.api;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Exposes sellable catalog product snapshots to the order module.
 */
public interface CatalogOrderingApi {

    /**
     * Validates a product configuration and returns its current sellable snapshot.
     */
    ProductSnapshot snapshot(ProductSelection selection);

    /**
     * Resolves the BOM contributions for a configured catalog product.
     */
    BomPlan bomPlan(ProductSelection selection);

    /**
     * Describes the catalog product configuration selected for an order item.
     */
    record ProductSelection(
            UUID productId,
            String purchaseModeCode,
            String choiceCode,
            List<ChoiceAllocation> allocations,
            List<IngredientSelection> ingredients) {

        /**
         * Normalizes optional configuration collections.
         */
        public ProductSelection {
            allocations = allocations != null ? List.copyOf(allocations) : List.of();
            ingredients = ingredients != null ? List.copyOf(ingredients) : List.of();
        }
    }

    /**
     * Represents one quantity allocated to a configured product choice.
     */
    record ChoiceAllocation(String choiceCode, int quantity) {
    }

    /**
     * Represents one selected catalog ingredient quantity.
     */
    record IngredientSelection(String ingredientCode, int quantity) {
    }

    /**
     * Represents the validated catalog data and pricing captured for an order item.
     */
    record ProductSnapshot(
            UUID productId,
            String productName,
            String productType,
            String imageUrl,
            int basePriceCents,
            int unitPriceCents,
            PurchaseModeSnapshot purchaseMode,
            ChoiceSelectionSnapshot choiceSelection,
            List<ChoiceAllocationSnapshot> choiceAllocations,
            List<IngredientSelectionSnapshot> ingredientSelections) {
    }

    /**
     * Represents the selected catalog purchase mode.
     */
    record PurchaseModeSnapshot(String code, String label, int quantity, String allocationType) {
    }

    /**
     * Represents the selected catalog choice.
     */
    record ChoiceSelectionSnapshot(String code, String name, String groupLabel) {
    }

    /**
     * Represents a validated choice allocation with its display name.
     */
    record ChoiceAllocationSnapshot(String code, String name, int quantity) {
    }

    /**
     * Represents a validated ingredient selection and its pricing snapshot.
     */
    record IngredientSelectionSnapshot(
            String code,
            String name,
            int quantity,
            int defaultQuantity,
            int extraPriceCents) {
    }

    /**
     * Represents the BOM contributions and diagnostics for one product selection.
     */
    record BomPlan(List<ApplicableBom> boms, List<String> warnings) {

        /**
         * Normalizes BOM and warning collections.
         */
        public BomPlan {
            boms = boms != null ? List.copyOf(boms) : List.of();
            warnings = warnings != null ? List.copyOf(warnings) : List.of();
        }
    }

    /**
     * Represents one BOM output quantity contributed by a product configuration.
     */
    record ApplicableBom(UUID bomId, BigDecimal quantity, String sourceName) {
    }

}
