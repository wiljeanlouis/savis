package com.savouretplus.savis.order.adapter.web;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderItem;
import com.savouretplus.savis.order.domain.OrderItemAllocationType;
import com.savouretplus.savis.order.domain.OrderItemProductType;
import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.domain.OrderStatus;

class OrderSummaryResponseTest {

    @Test
    void exposesAtMostThreeProductImagePreviews() {
        Instant now = Instant.parse("2026-08-08T15:00:00Z");
        List<OrderItem> items = List.of(item(1), item(2), item(3), item(4));
        Order order = new Order(
                1L, UUID.randomUUID(), "ADM-00000001", OrderSource.ADMIN, OrderStatus.NEW,
                "Ada", "514", null, null, 4000, null, now, now,
                null, null, null, null, null, items, Map.of());

        OrderSummaryResponse response = OrderSummaryResponse.from(order);

        assertEquals(4, response.itemCount());
        assertEquals(3, response.itemPreviews().size());
        assertEquals("Produit 1", response.itemPreviews().getFirst().productName());
        assertEquals("/products/1.jpg", response.itemPreviews().getFirst().imageUrl());
    }

    private OrderItem item(int number) {
        return new OrderItem(
                null, UUID.randomUUID(), UUID.randomUUID(), "Produit " + number,
                OrderItemProductType.STANDARD, "/products/" + number + ".jpg",
                1, 1000, 1000, 1000, "unit", "Unité", 1,
                OrderItemAllocationType.NONE, null, List.of(), List.of(), List.of());
    }
}
