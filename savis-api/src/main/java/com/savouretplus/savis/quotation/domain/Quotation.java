package com.savouretplus.savis.quotation.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Represents a commercial quotation independently from an order.
 */
public record Quotation(
        Long id,
        UUID publicId,
        String quotationNumber,
        QuotationStatus status,
        String customerName,
        String customerPhone,
        String customerEmail,
        QuotationAddress customerAddress,
        LocalDate validUntil,
        String note,
        int discountCents,
        int deliveryFeeCents,
        int totalCents,
        Instant createdAt,
        Instant updatedAt,
        Instant sentAt,
        Instant acceptedAt,
        Instant rejectedAt,
        UUID convertedOrderId,
        List<QuotationItem> items) {

    /** Validates required commercial terms and immutable snapshots. */
    public Quotation {
        publicId = publicId != null ? publicId : UUID.randomUUID();
        requireText(quotationNumber, "Le numéro de soumission est requis");
        requireText(customerName, "Le nom du client est requis");
        requireText(customerPhone, "Le téléphone du client est requis");
        if (status == null || validUntil == null || createdAt == null || updatedAt == null) {
            throw new IllegalArgumentException("Le statut et les dates de la soumission sont requis");
        }
        items = items != null ? List.copyOf(items) : List.of();
        if (items.isEmpty()) {
            throw new IllegalArgumentException("La soumission doit contenir au moins un produit");
        }
        if (discountCents < 0 || deliveryFeeCents < 0 || totalCents < 0) {
            throw new IllegalArgumentException("Les montants de la soumission ne peuvent pas être négatifs");
        }
        if (totalCents != subtotalCents(items) - discountCents + deliveryFeeCents) {
            throw new IllegalArgumentException("Le total de la soumission est incohérent");
        }
        customerAddress = customerAddress == null || customerAddress.isEmpty() ? null : customerAddress;
    }

    /** Returns the captured item subtotal. */
    public int subtotalCents() {
        return subtotalCents(items);
    }

    /** Applies a supported quotation status transition. */
    public Quotation changeStatus(QuotationStatus next, Instant changedAt) {
        if (next == status) {
            return this;
        }
        if (!allowedNextStatuses().contains(next)) {
            throw new IllegalStateException("Transition de statut invalide: %s vers %s".formatted(status, next));
        }
        return new Quotation(
                id, publicId, quotationNumber, next, customerName, customerPhone, customerEmail,
                customerAddress, validUntil, note, discountCents, deliveryFeeCents, totalCents,
                createdAt, changedAt,
                next == QuotationStatus.SENT && sentAt == null ? changedAt : sentAt,
                next == QuotationStatus.ACCEPTED && acceptedAt == null ? changedAt : acceptedAt,
                next == QuotationStatus.REJECTED && rejectedAt == null ? changedAt : rejectedAt,
                convertedOrderId, items);
    }

    /** Records the order created from this accepted quotation. */
    public Quotation convertedTo(UUID orderId, Instant changedAt) {
        if (status != QuotationStatus.ACCEPTED) {
            throw new IllegalStateException("Seule une soumission acceptée peut être convertie");
        }
        if (convertedOrderId != null && !convertedOrderId.equals(orderId)) {
            throw new IllegalStateException("La soumission a déjà été convertie");
        }
        return new Quotation(
                id, publicId, quotationNumber, status, customerName, customerPhone, customerEmail,
                customerAddress, validUntil, note, discountCents, deliveryFeeCents, totalCents,
                createdAt, changedAt, sentAt, acceptedAt, rejectedAt, orderId, items);
    }

    private Set<QuotationStatus> allowedNextStatuses() {
        return switch (status) {
            case DRAFT -> Set.of(QuotationStatus.SENT);
            case SENT -> Set.of(QuotationStatus.ACCEPTED, QuotationStatus.REJECTED);
            case ACCEPTED, REJECTED -> Set.of();
        };
    }

    private static int subtotalCents(List<QuotationItem> values) {
        return values.stream().mapToInt(QuotationItem::lineTotalCents).sum();
    }

    private static void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }
}
