package com.savouretplus.savis.sales.quotation.adapter.web;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.sales.quotation.domain.Quotation;
import com.savouretplus.savis.sales.quotation.domain.QuotationAddress;
import com.savouretplus.savis.sales.quotation.domain.QuotationItem;
import com.savouretplus.savis.sales.quotation.domain.QuotationStatus;

/** Represents a complete quotation including captured catalog snapshots. */
public record QuotationResponse(
        UUID id,
        String quotationNumber,
        QuotationStatus status,
        String customerName,
        String customerPhone,
        String customerEmail,
        AddressResponse customerAddress,
        LocalDate validUntil,
        String note,
        int subtotalCents,
        int discountCents,
        int deliveryFeeCents,
        int totalCents,
        Instant createdAt,
        Instant updatedAt,
        Instant sentAt,
        Instant acceptedAt,
        Instant rejectedAt,
        UUID convertedOrderId,
        List<ItemResponse> items, UUID sourceQuoteRequestId) {

    /** Maps a quotation aggregate to its REST representation. */
    static QuotationResponse from(Quotation quotation) {
        return new QuotationResponse(
                quotation.publicId(), quotation.quotationNumber(), quotation.status(), quotation.customerName(),
                quotation.customerPhone(), quotation.customerEmail(), AddressResponse.from(quotation.customerAddress()),
                quotation.validUntil(), quotation.note(), quotation.subtotalCents(), quotation.discountCents(),
                quotation.deliveryFeeCents(), quotation.totalCents(), quotation.createdAt(), quotation.updatedAt(),
                quotation.sentAt(), quotation.acceptedAt(), quotation.rejectedAt(), quotation.convertedOrderId(),
                quotation.items().stream().map(ItemResponse::from).toList(),quotation.sourceQuoteRequestId());
    }

    /** Represents the optional structured customer address. */
    public record AddressResponse(String line1, String line2, String city, String province, String postalCode) {
        private static AddressResponse from(QuotationAddress address) {
            return address == null ? null : new AddressResponse(
                    address.line1(), address.line2(), address.city(), address.province(), address.postalCode());
        }
    }

    /** Represents one immutable product and price snapshot. */
    public record ItemResponse(
            UUID id,
            UUID productId,
            String productNameSnapshot,
            String commercialType,
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
            String rawKey,
            List<ChoiceResponse> choiceSelections,
            List<AllocationResponse> choiceAllocations,
            List<IngredientResponse> ingredientSelections) {

        private static ItemResponse from(QuotationItem item) {
            return new ItemResponse(
                    item.publicId(), item.productId(), item.productName(), item.commercialType(), item.productType(),
                    item.imageUrl(), item.quantity(), item.basePriceCents(), item.unitPriceCents(),
                    item.lineTotalCents(), item.purchaseModeId(), item.purchaseModeLabel(),
                    item.purchaseModeQuantity(), item.allocationType(), null,
                    item.choices().stream().map(value -> new ChoiceResponse(
                            value.id(), value.name(), value.groupLabel())).toList(),
                    item.allocations().stream().map(value -> new AllocationResponse(
                            value.id(), value.name(), value.quantity())).toList(),
                    item.ingredients().stream().map(value -> new IngredientResponse(
                            value.id(), value.name(), value.quantity(), value.defaultQuantity(),
                            value.extraPriceCents())).toList());
        }
    }

    /** Represents a selected choice snapshot. */
    public record ChoiceResponse(String choiceId, String choiceName, String groupLabel) {
    }

    /** Represents an allocated choice snapshot. */
    public record AllocationResponse(String choiceId, String choiceName, int quantity) {
    }

    /** Represents an ingredient snapshot. */
    public record IngredientResponse(
            String ingredientId, String ingredientName, int quantity, int defaultQuantity, int extraPriceCents) {
    }
}
