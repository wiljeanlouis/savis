package com.savouretplus.savis.order.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class OrderTest {
    private static final Instant NOW = Instant.parse("2026-10-13T12:00:00Z");

    @Test
    void calculatesNewSnapshotTotalsExactly() {
        OrderItem item = item(2, 1200, 2400);

        assertEquals(2450, Order.calculateTotalCents(List.of(item), 100, 150));
        assertThrows(IllegalArgumentException.class,
                () -> Order.calculateTotalCents(List.of(item), 2401, 0));
        assertThrows(IllegalArgumentException.class, () -> Order.calculateTotalCents(
                List.of(item(1, Integer.MAX_VALUE, Integer.MAX_VALUE), item), 0, 0));
        assertThrows(IllegalArgumentException.class, () -> item(2, 1200, 2399));
        assertThrows(IllegalArgumentException.class, () -> item(Integer.MAX_VALUE, 2, 0));
    }

    @Test
    void allowsCancellationUntilCompletionAndKeepsTerminalStatusesClosed() {
        for (OrderStatus status : List.of(
                OrderStatus.NEW, OrderStatus.ACCEPTED, OrderStatus.IN_PREPARATION, OrderStatus.READY)) {
            Order cancelled = order(status).changeStatus(OrderStatus.CANCELLED, NOW.plusSeconds(60));
            assertEquals(OrderStatus.CANCELLED, cancelled.status());
            assertEquals(NOW.plusSeconds(60), cancelled.cancelledAt());
        }

        assertThrows(IllegalStateException.class,
                () -> order(OrderStatus.COMPLETED).changeStatus(OrderStatus.CANCELLED, NOW.plusSeconds(60)));
        assertThrows(IllegalStateException.class,
                () -> order(OrderStatus.REJECTED).changeStatus(OrderStatus.CANCELLED, NOW.plusSeconds(60)));
    }

    private Order order(OrderStatus status) {
        OrderItem item = item(1, 100, 100);
        return new Order(
                null, UUID.randomUUID(), "ADM-00000001", OrderSource.ADMIN, status,
                "Ada", "+15145550100", null, null, null,
                0, 0, 100, null, NOW, NOW,
                status == OrderStatus.ACCEPTED ? NOW : null,
                status == OrderStatus.IN_PREPARATION ? NOW : null,
                status == OrderStatus.READY ? NOW : null,
                status == OrderStatus.COMPLETED ? NOW : null,
                status == OrderStatus.CANCELLED ? NOW : null,
                List.of(item), Map.of());
    }

    private OrderItem item(int quantity, int unitPriceCents, int lineTotalCents) {
        return new OrderItem(
                null, null, UUID.randomUUID(), "Service", OrderItemProductType.STANDARD, null,
                quantity, unitPriceCents, unitPriceCents, lineTotalCents,
                "unit", "Unité", 1, OrderItemAllocationType.NONE, null,
                List.of(), List.of(), List.of());
    }
}
