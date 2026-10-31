package com.savouretplus.savis.order.adapter.web;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderItem;
import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.domain.OrderStatus;

/**
 * Represents the compact order data used by the administration list.
 */
public record OrderSummaryResponse(
        UUID id,
        String orderNumber,
        OrderSource source,
        OrderStatus status,
        String customerName,
        String customerPhone,
        String customerEmail,
        int itemCount,
        List<OrderItemPreviewResponse> itemPreviews,
        int totalCents,
        Instant placedAt,
        Instant importedAt) {

    /**
     * Creates a summary response from an order aggregate.
     */
    static OrderSummaryResponse from(Order order) {
        return new OrderSummaryResponse(
                order.publicId(), order.orderNumber(), order.source(), order.status(), order.customerName(),
                order.customerPhone(), order.customerEmail(), order.items().size(),
                order.items().stream().limit(3).map(OrderItemPreviewResponse::from).toList(),
                order.totalCents(), order.placedAt(), order.importedAt());
    }

    /**
     * Represents one product thumbnail displayed in the compact order list.
     */
    public record OrderItemPreviewResponse(UUID id, String productName, String imageUrl) {

        /**
         * Creates an item preview from its immutable order snapshot.
         */
        static OrderItemPreviewResponse from(OrderItem item) {
            return new OrderItemPreviewResponse(
                    item.publicId(), item.productNameSnapshot(), item.imageUrl());
        }
    }
}
