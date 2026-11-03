package com.savouretplus.savis.sales.order.api;

import java.util.List;
import java.util.UUID;

/**
 * Creates an order from the immutable commercial terms of an accepted quotation.
 */
public interface QuotationOrderApi {

    /**
     * Creates the order once, or returns the order already created for the quotation.
     */
    UUID create(QuotationSnapshot quotation);

    /**
     * Represents the accepted quotation values copied into an order.
     */
    record QuotationSnapshot(
            UUID quotationId,
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

    /** Represents a customer address snapshot. */
    record Address(String line1, String line2, String city, String province, String postalCode) {
    }

    /** Represents one priced and configured product snapshot. */
    record Item(
            UUID productId, String productName, String productType, String imageUrl,
            int quantity, int basePriceCents, int unitPriceCents, int lineTotalCents,
            String purchaseModeId, String purchaseModeLabel, Integer purchaseModeQuantity,
            String allocationType, List<Choice> choices, List<Allocation> allocations,
            List<Ingredient> ingredients) {
    }

    /** Represents a selected choice snapshot. */
    record Choice(String id, String name, String groupLabel) {
    }

    /** Represents an allocated choice snapshot. */
    record Allocation(String id, String name, int quantity) {
    }

    /** Represents a selected ingredient snapshot. */
    record Ingredient(String id, String name, int quantity, int defaultQuantity, int extraPriceCents) {
    }
}
