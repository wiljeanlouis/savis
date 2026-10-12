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
        if (source == OrderSource.SAVOURETPLUS_WEB && externalOrderId == null) {
            throw new IllegalArgumentException("L'identifiant externe d'une commande web est requis");
        }
        if (totalCents < 0) {
            throw new IllegalArgumentException("Le total de la commande ne peut pas être négatif");
        }
        items = items != null ? List.copyOf(items) : List.of();
        rawPayload = rawPayload != null
                ? Collections.unmodifiableMap(new LinkedHashMap<>(rawPayload))
                : Map.of();
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
                customerEmail, note, totalCents, externalOrderId, placedAt, importedAt,
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
