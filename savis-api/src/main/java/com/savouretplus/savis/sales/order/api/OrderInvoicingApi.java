package com.savouretplus.savis.sales.order.api;

import java.util.List;
import java.util.UUID;

/**
 * Exposes an immutable, invoice-ready snapshot of an eligible order.
 */
public interface OrderInvoicingApi {

    /**
     * Locks the source order and returns its captured commercial terms.
     */
    OrderSnapshot snapshotForInvoice(UUID orderId);

    /** Represents all order values copied into an invoice. */
    record OrderSnapshot(
            UUID orderId,
            String orderNumber,
            String customerName,
            String customerPhone,
            String customerEmail,
            Address address,
            String note,
            int discountCents,
            int deliveryFeeCents,
            int totalCents,
            List<Item> items) {
    }

    /** Represents a captured customer address. */
    record Address(String line1, String line2, String city, String province, String postalCode) {
    }

    /** Represents one priced and configured order line. */
    record Item(
            UUID itemId,
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
    }

    /** Represents a selected product choice. */
    record Choice(String id, String name, String groupLabel) {
    }

    /** Represents an allocated product choice. */
    record Allocation(String id, String name, int quantity) {
    }

    /** Represents a selected ingredient. */
    record Ingredient(String id, String name, int quantity, int defaultQuantity, int extraPriceCents) {
    }
}
