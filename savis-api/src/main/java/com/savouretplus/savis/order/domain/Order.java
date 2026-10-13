package com.savouretplus.savis.order.domain;

import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Represents the aggregate root of a normalized SAVIS order.
 */
public record Order(
        Long id,
        UUID publicId,
        String orderNumber,
        OrderSource source,
        OrderStatus status,
        String customerName,
        String customerPhone,
        String customerEmail,
        OrderAddress customerAddress,
        String note,
        int discountCents,
        int deliveryFeeCents,
        int totalCents,
        UUID externalOrderId,
        Instant placedAt,
        Instant importedAt,
        Instant acceptedAt,
        Instant inPreparationAt,
        Instant readyAt,
        Instant completedAt,
        Instant cancelledAt,
        List<OrderItem> items,
        Map<String, Object> rawPayload) {

    /**
     * Validates required order data and normalizes imported snapshots.
     */
    public Order {
        publicId = publicId != null ? publicId : UUID.randomUUID();
        requireText(orderNumber, "Le numéro de commande est requis");
        requireText(customerName, "Le nom du client est requis");
        requireText(customerPhone, "Le téléphone du client est requis");
        if (source == null || status == null || placedAt == null || importedAt == null) {
            throw new IllegalArgumentException("La source, le statut et les dates de commande sont requis");
        }
        if ((source == OrderSource.SAVOURETPLUS_WEB || source == OrderSource.QUOTATION)
                && externalOrderId == null) {
            throw new IllegalArgumentException("L'identifiant d'origine de la commande est requis");
        }
        if (totalCents < 0) {
            throw new IllegalArgumentException("Le total de la commande ne peut pas être négatif");
        }
        if (discountCents < 0 || deliveryFeeCents < 0) {
            throw new IllegalArgumentException("Le rabais et les frais de livraison ne peuvent pas être négatifs");
        }
        customerAddress = customerAddress == null || customerAddress.isEmpty() ? null : customerAddress;
        items = items != null ? List.copyOf(items) : List.of();
        rawPayload = rawPayload != null
                ? Collections.unmodifiableMap(new LinkedHashMap<>(rawPayload))
                : Map.of();
    }

    /**
     * Creates an order without optional billing adjustments or a customer address.
     */
    public Order(
            Long id,
            UUID publicId,
            String orderNumber,
            OrderSource source,
            OrderStatus status,
            String customerName,
            String customerPhone,
            String customerEmail,
            String note,
            int totalCents,
            UUID externalOrderId,
            Instant placedAt,
            Instant importedAt,
            Instant acceptedAt,
            Instant inPreparationAt,
            Instant readyAt,
            Instant completedAt,
            Instant cancelledAt,
            List<OrderItem> items,
            Map<String, Object> rawPayload) {
        this(
                id, publicId, orderNumber, source, status, customerName, customerPhone, customerEmail,
                null, note, 0, 0, totalCents, externalOrderId, placedAt, importedAt, acceptedAt,
                inPreparationAt, readyAt, completedAt, cancelledAt, items, rawPayload);
    }

    /**
     * Returns the sum of all captured order-item line totals.
     */
    public int subtotalCents() {
        return items.stream().mapToInt(OrderItem::lineTotalCents).sum();
    }

    /**
     * Applies a valid status transition and records its first transition timestamp.
     */
    public Order changeStatus(OrderStatus nextStatus, Instant changedAt) {
        if (nextStatus == null || changedAt == null) {
            throw new IllegalArgumentException("Le nouveau statut et sa date sont requis");
        }
        if (nextStatus == status) {
            return this;
        }
        if (!allowedNextStatuses().contains(nextStatus)) {
            throw new IllegalStateException(
                    "Transition de statut invalide: %s vers %s".formatted(status, nextStatus));
        }

        return new Order(
                id, publicId, orderNumber, source, nextStatus, customerName, customerPhone,
                customerEmail, customerAddress, note, discountCents, deliveryFeeCents, totalCents,
                externalOrderId, placedAt, importedAt,
                nextStatus == OrderStatus.ACCEPTED && acceptedAt == null ? changedAt : acceptedAt,
                nextStatus == OrderStatus.IN_PREPARATION && inPreparationAt == null ? changedAt : inPreparationAt,
                nextStatus == OrderStatus.READY && readyAt == null ? changedAt : readyAt,
                nextStatus == OrderStatus.COMPLETED && completedAt == null ? changedAt : completedAt,
                nextStatus == OrderStatus.CANCELLED && cancelledAt == null ? changedAt : cancelledAt,
                items, rawPayload);
    }

    private Set<OrderStatus> allowedNextStatuses() {
        return switch (status) {
            case NEW -> Set.of(OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED);
            case ACCEPTED -> Set.of(OrderStatus.IN_PREPARATION, OrderStatus.CANCELLED);
            case IN_PREPARATION -> Set.of(OrderStatus.READY, OrderStatus.CANCELLED);
            case READY -> Set.of(OrderStatus.COMPLETED, OrderStatus.CANCELLED);
            case COMPLETED, CANCELLED, REJECTED -> Set.of();
        };
    }

    private static void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }
}
