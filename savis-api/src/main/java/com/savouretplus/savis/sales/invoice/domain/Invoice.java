package com.savouretplus.savis.sales.invoice.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Represents a persisted commercial invoice independently from its source order.
 */
public record Invoice(
        Long id,
        UUID publicId,
        String invoiceNumber,
        UUID sourceOrderId,
        String sourceOrderNumber,
        InvoiceStatus status,
        PaymentStatus paymentStatus,
        Instant paidAt,
        String customerName,
        String customerPhone,
        String customerEmail,
        InvoiceAddress customerAddress,
        String note,
        int discountCents,
        int deliveryFeeCents,
        int gstCents,
        int qstCents,
        int totalCents,
        Instant createdAt,
        Instant updatedAt,
        Instant issuedAt,
        Instant cancelledAt,
        List<InvoiceItem> items) {

    /** Validates lifecycle consistency and exact financial totals. */
    public Invoice {
        paymentStatus = paymentStatus == null ? PaymentStatus.UNPAID : paymentStatus;
        publicId = publicId != null ? publicId : UUID.randomUUID();
        requireText(sourceOrderNumber, "Le numéro de la commande source est requis");
        requireText(customerName, "Le nom du client est requis");
        requireText(customerPhone, "Le téléphone du client est requis");
        if (sourceOrderId == null || status == null || paymentStatus == null || createdAt == null || updatedAt == null) {
            throw new IllegalArgumentException("La commande source, le statut et les dates de facture sont requis");
        }
        items = items != null ? List.copyOf(items) : List.of();
        if (items.isEmpty()) {
            throw new IllegalArgumentException("La facture doit contenir au moins une ligne");
        }
        customerAddress = customerAddress == null || customerAddress.isEmpty() ? null : customerAddress;
        validateAmounts(items, discountCents, deliveryFeeCents, gstCents, qstCents, totalCents);
        validateLifecycle(status, paymentStatus, invoiceNumber, issuedAt, cancelledAt, paidAt);
    }

    /** Returns the exact sum of captured line totals. */
    public int subtotalCents() {
        return subtotal(items);
    }

    /** Returns the captured GST and QST total. */
    public int taxCents() {
        return addExact(gstCents, qstCents, "Le total des taxes dépasse la limite permise");
    }

    /** Replaces editable customer and financial fields while the invoice is a draft. */
    public Invoice updateDraft(
            String customerName,
            String customerPhone,
            String customerEmail,
            InvoiceAddress customerAddress,
            String note,
            int discountCents,
            int deliveryFeeCents,
            int gstCents,
            int qstCents,
            Instant changedAt) {
        requireDraft();
        int total = total(subtotalCents(), discountCents, deliveryFeeCents, gstCents, qstCents);
        return new Invoice(
                id, publicId, null, sourceOrderId, sourceOrderNumber, status,
                PaymentStatus.UNPAID, null,
                customerName, customerPhone, customerEmail, customerAddress, note,
                discountCents, deliveryFeeCents, gstCents, qstCents, total,
                createdAt, changedAt, null, null, items);
    }

    /** Assigns the durable business number and freezes the invoice. */
    public Invoice issue(String number, Instant changedAt) {
        requireDraft();
        requireText(number, "Le numéro de facture est requis à l'émission");
        return new Invoice(
                id, publicId, number, sourceOrderId, sourceOrderNumber, InvoiceStatus.ISSUED,
                PaymentStatus.UNPAID, null,
                customerName, customerPhone, customerEmail, customerAddress, note,
                discountCents, deliveryFeeCents, gstCents, qstCents, totalCents,
                createdAt, changedAt, changedAt, null, items);
    }

    /** Marks an issued invoice as fully paid. */
    public Invoice markPaid(Instant changedAt) {
        if (status != InvoiceStatus.ISSUED) {
            throw new IllegalStateException("Seule une facture émise peut être marquée comme payée");
        }
        if (paymentStatus == PaymentStatus.PAID) {
            return this;
        }
        return new Invoice(
                id, publicId, invoiceNumber, sourceOrderId, sourceOrderNumber, status,
                PaymentStatus.PAID, changedAt,
                customerName, customerPhone, customerEmail, customerAddress, note,
                discountCents, deliveryFeeCents, gstCents, qstCents, totalCents,
                createdAt, changedAt, issuedAt, cancelledAt, items);
    }

    /** Reverts a previously confirmed settlement. */
    public Invoice revertPayment(Instant changedAt) {
        if (paymentStatus != PaymentStatus.PAID) {
            throw new IllegalStateException("Seule une facture payée peut être corrigée");
        }
        return new Invoice(
                id, publicId, invoiceNumber, sourceOrderId, sourceOrderNumber, status,
                PaymentStatus.UNPAID, null,
                customerName, customerPhone, customerEmail, customerAddress, note,
                discountCents, deliveryFeeCents, gstCents, qstCents, totalCents,
                createdAt, changedAt, issuedAt, cancelledAt, items);
    }

    /** Cancels a draft or issued invoice without creating a credit note. */
    public Invoice cancel(Instant changedAt) {
        if (status == InvoiceStatus.CANCELLED) {
            return this;
        }
        if (paymentStatus == PaymentStatus.PAID) {
            throw new IllegalStateException("Une facture payée ne peut pas être annulée");
        }
        return new Invoice(
                id, publicId, invoiceNumber, sourceOrderId, sourceOrderNumber, InvoiceStatus.CANCELLED,
                PaymentStatus.UNPAID, null,
                customerName, customerPhone, customerEmail, customerAddress, note,
                discountCents, deliveryFeeCents, gstCents, qstCents, totalCents,
                createdAt, changedAt, issuedAt, changedAt, items);
    }

    /** Reports whether a final commercial PDF can be produced. */
    public boolean isDocumentable() {
        return invoiceNumber != null && issuedAt != null;
    }

    private void requireDraft() {
        if (status != InvoiceStatus.DRAFT) {
            throw new IllegalStateException("Seule une facture brouillon peut être modifiée ou émise");
        }
    }

    private static void validateAmounts(
            List<InvoiceItem> items,
            int discountCents,
            int deliveryFeeCents,
            int gstCents,
            int qstCents,
            int totalCents) {
        int subtotal = subtotal(items);
        if (discountCents < 0 || deliveryFeeCents < 0 || gstCents < 0 || qstCents < 0 || totalCents < 0) {
            throw new IllegalArgumentException("Les montants de la facture ne peuvent pas être négatifs");
        }
        if (discountCents > subtotal) {
            throw new IllegalArgumentException("Le rabais ne peut pas dépasser le sous-total de la facture");
        }
        if (totalCents != total(subtotal, discountCents, deliveryFeeCents, gstCents, qstCents)) {
            throw new IllegalArgumentException("Le total de la facture est incohérent");
        }
    }

    private static void validateLifecycle(
            InvoiceStatus status,
            PaymentStatus paymentStatus,
            String invoiceNumber,
            Instant issuedAt,
            Instant cancelledAt,
            Instant paidAt) {
        switch (status) {
            case DRAFT -> {
                if (invoiceNumber != null || issuedAt != null || cancelledAt != null || paidAt != null || paymentStatus != PaymentStatus.UNPAID) {
                    throw new IllegalArgumentException("Une facture brouillon ne peut pas être émise, annulée ou réglée");
                }
            }
            case ISSUED -> {
                requireText(invoiceNumber, "Une facture émise doit avoir un numéro");
                if (issuedAt == null || cancelledAt != null) {
                    throw new IllegalArgumentException("Les dates de la facture émise sont incohérentes");
                }
                if (paymentStatus == PaymentStatus.PAID && paidAt == null) {
                    throw new IllegalArgumentException("Une facture payée doit enregistrer une date de confirmation");
                }
                if (paymentStatus == PaymentStatus.UNPAID && paidAt != null) {
                    throw new IllegalArgumentException("Une facture non payée ne peut pas conserver une date de paiement");
                }
            }
            case CANCELLED -> {
                if (cancelledAt == null || (issuedAt == null) != (invoiceNumber == null)) {
                    throw new IllegalArgumentException("Les données de la facture annulée sont incohérentes");
                }
                if (paymentStatus == PaymentStatus.PAID) {
                    throw new IllegalArgumentException("Une facture annulée ne peut pas être payée");
                }
            }
        }
    }

    private static int subtotal(List<InvoiceItem> items) {
        int result = 0;
        try {
            for (InvoiceItem item : items) {
                result = Math.addExact(result, item.lineTotalCents());
            }
            return result;
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("Le sous-total de la facture dépasse la limite permise", exception);
        }
    }

    private static int total(int subtotal, int discount, int delivery, int gst, int qst) {
        try {
            int afterDiscount = Math.subtractExact(subtotal, discount);
            return Math.addExact(Math.addExact(Math.addExact(afterDiscount, delivery), gst), qst);
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("Le total de la facture dépasse la limite permise", exception);
        }
    }

    private static int addExact(int left, int right, String message) {
        try {
            return Math.addExact(left, right);
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException(message, exception);
        }
    }

    private static void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }
}
