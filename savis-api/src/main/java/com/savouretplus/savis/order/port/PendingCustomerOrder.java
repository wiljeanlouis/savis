package com.savouretplus.savis.order.port;

import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Represents a provider-neutral snapshot of a customer order waiting to be imported.
 */
public record PendingCustomerOrder(
        UUID externalId,
        String customerName,
        String customerPhone,
        String customerEmail,
        String note,
        String externalStatus,
        String externalSource,
        int totalCents,
        List<Item> items,
        Instant placedAt,
        Map<String, Object> rawPayload) {

    /**
     * Normalizes imported item and raw-payload collections.
     */
    public PendingCustomerOrder {
        items = items != null ? List.copyOf(items) : List.of();
        rawPayload = rawPayload != null
                ? Collections.unmodifiableMap(new LinkedHashMap<>(rawPayload))
                : Map.of();
    }

    /**
     * Represents a typed product snapshot supplied by the external order source.
     */
    public record Item(
            UUID productId,
            String name,
            String productType,
            String imageUrl,
            int quantity,
            Integer basePriceCents,
            int unitPriceCents,
            PurchaseMode purchaseMode,
            ChoiceSelection selection,
            List<ChoiceAllocation> allocations,
            List<IngredientSelection> ingredients,
            String rawKey) {

        /**
         * Normalizes choice-allocation and ingredient-selection collections.
         */
        public Item {
            allocations = allocations != null ? List.copyOf(allocations) : List.of();
            ingredients = ingredients != null ? List.copyOf(ingredients) : List.of();
        }
    }

    /**
     * Represents the purchase mode selected for an imported order item.
     */
    public record PurchaseMode(String id, String label, int quantity, String allocationType) {
    }

    /**
     * Represents the single choice selected for an imported order item.
     */
    public record ChoiceSelection(String choiceId, String choiceName, String groupLabel) {
    }

    /**
     * Represents one quantity allocated to a product choice.
     */
    public record ChoiceAllocation(String choiceId, String choiceName, int quantity) {
    }

    /**
     * Represents one ingredient quantity selected by the customer.
     */
    public record IngredientSelection(
            String id,
            String name,
            int quantity,
            int defaultQuantity,
            int extraPriceCents) {
    }
}
