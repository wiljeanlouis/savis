package com.savouretplus.savis.sales.quotation.usecase;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.sales.quotation.domain.QuotationAddress;

/** Describes editable commercial terms for a draft quotation. */
public record SaveQuotationCommand(
        String customerName,
        String customerPhone,
        String customerEmail,
        QuotationAddress customerAddress,
        LocalDate validUntil,
        String note,
        int discountCents,
        int deliveryFeeCents,
        List<Item> items) {

    /** Normalizes the selected product collection. */
    public SaveQuotationCommand {
        items = items != null ? List.copyOf(items) : List.of();
    }

    /** Describes one configured catalog product. */
    public record Item(
            UUID productId, int quantity, String purchaseModeCode, String choiceCode,
            List<ChoiceAllocation> allocations, List<IngredientSelection> ingredients) {
        public Item {
            allocations = allocations != null ? List.copyOf(allocations) : List.of();
            ingredients = ingredients != null ? List.copyOf(ingredients) : List.of();
        }
    }

    /** Represents a configured choice allocation. */
    public record ChoiceAllocation(String choiceCode, int quantity) {
    }

    /** Represents a configured ingredient quantity. */
    public record IngredientSelection(String ingredientCode, int quantity) {
    }
}
