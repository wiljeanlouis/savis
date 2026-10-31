package com.savouretplus.savis.sales.order.port;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.sales.order.domain.OrderItemAllocationType;
import com.savouretplus.savis.sales.order.domain.OrderItemProductType;

/**
 * Defines catalog operations required to create administrative orders.
 */
public interface OrderCatalog {

    /**
     * Validates a product selection and returns the snapshot to store on the order.
     */
    ProductSnapshot snapshot(ProductSelection selection);

    /**
     * Resolves BOM contributions for an ordered product configuration.
     */
    BomPlan bomPlan(ProductSelection selection);

    /**
     * Describes the product configuration selected by an administrator.
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
     * Represents one selected choice allocation.
     */
    record ChoiceAllocation(String choiceCode, int quantity) {
    }

    /**
     * Represents one selected ingredient quantity.
     */
    record IngredientSelection(String ingredientCode, int quantity) {
    }

    /**
     * Represents the validated product and pricing snapshot used by an order item.
     */
    record ProductSnapshot(
            UUID productId,
            String productName,
            OrderItemProductType productType,
            String imageUrl,
            int basePriceCents,
            int unitPriceCents,
            PurchaseMode purchaseMode,
            ChoiceSelection choiceSelection,
            List<ChoiceAllocationSnapshot> choiceAllocations,
            List<IngredientSelectionSnapshot> ingredientSelections) {
    }

    /**
     * Represents the purchase mode captured for an administrative order.
     */
    record PurchaseMode(
            String code,
            String label,
            int quantity,
            OrderItemAllocationType allocationType) {
    }

    /**
     * Represents the selected product choice snapshot.
     */
    record ChoiceSelection(String code, String name, String groupLabel) {
    }

    /**
     * Represents one named product choice allocation snapshot.
     */
    record ChoiceAllocationSnapshot(String code, String name, int quantity) {
    }

    /**
     * Represents one named ingredient and pricing snapshot.
     */
    record IngredientSelectionSnapshot(
            String code,
            String name,
            int quantity,
            int defaultQuantity,
            int extraPriceCents) {
    }

    /**
     * Represents BOM contributions and diagnostics for one ordered product.
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
     * Represents one BOM output quantity used by an ordered product.
     */
    record ApplicableBom(UUID bomId, BigDecimal quantity, String sourceName) {
    }

}
