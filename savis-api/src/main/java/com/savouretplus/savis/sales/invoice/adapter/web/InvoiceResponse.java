package com.savouretplus.savis.sales.invoice.adapter.web;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.sales.invoice.domain.Invoice;
import com.savouretplus.savis.sales.invoice.domain.InvoiceAddress;
import com.savouretplus.savis.sales.invoice.domain.InvoiceItem;
import com.savouretplus.savis.sales.invoice.domain.InvoiceStatus;

/** Represents a complete persisted invoice snapshot. */
public record InvoiceResponse(
        UUID id,
        String invoiceNumber,
        UUID sourceOrderId,
        String sourceOrderNumber,
        InvoiceStatus status,
        String customerName,
        String customerPhone,
        String customerEmail,
        AddressResponse customerAddress,
        String note,
        int subtotalCents,
        int discountCents,
        int deliveryFeeCents,
        int gstCents,
        int qstCents,
        int taxCents,
        int totalCents,
        Instant createdAt,
        Instant updatedAt,
        Instant issuedAt,
        Instant cancelledAt,
        List<ItemResponse> items) {

    /** Maps an invoice aggregate to its REST representation. */
    static InvoiceResponse from(Invoice invoice) {
        return new InvoiceResponse(
                invoice.publicId(), invoice.invoiceNumber(), invoice.sourceOrderId(), invoice.sourceOrderNumber(),
                invoice.status(), invoice.customerName(), invoice.customerPhone(), invoice.customerEmail(),
                AddressResponse.from(invoice.customerAddress()), invoice.note(), invoice.subtotalCents(),
                invoice.discountCents(), invoice.deliveryFeeCents(), invoice.gstCents(), invoice.qstCents(),
                invoice.taxCents(), invoice.totalCents(), invoice.createdAt(), invoice.updatedAt(),
                invoice.issuedAt(), invoice.cancelledAt(), invoice.items().stream().map(ItemResponse::from).toList());
    }

    /** Represents the captured customer address. */
    public record AddressResponse(String line1, String line2, String city, String province, String postalCode) {
        private static AddressResponse from(InvoiceAddress address) {
            return address == null ? null : new AddressResponse(
                    address.line1(), address.line2(), address.city(), address.province(), address.postalCode());
        }
    }

    /** Represents one immutable invoiced order-line snapshot. */
    public record ItemResponse(
            UUID id,
            UUID sourceOrderItemId,
            UUID productId,
            String productNameSnapshot,
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

        private static ItemResponse from(InvoiceItem item) {
            return new ItemResponse(
                    item.publicId(), item.sourceOrderItemId(), item.productId(), item.productName(),
                    item.productType(), item.imageUrl(), item.quantity(), item.basePriceCents(),
                    item.unitPriceCents(), item.lineTotalCents(), item.purchaseModeId(), item.purchaseModeLabel(),
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

    /** Represents a selected ingredient snapshot. */
    public record IngredientResponse(
            String ingredientId, String ingredientName, int quantity, int defaultQuantity, int extraPriceCents) {
    }
}
