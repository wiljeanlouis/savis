package com.savouretplus.savis.order.adapter.web;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderItem;
import com.savouretplus.savis.order.domain.OrderItemAllocationType;
import com.savouretplus.savis.order.domain.OrderItemProductType;
import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.domain.OrderStatus;

/**
 * Represents a complete order response including all imported item snapshots.
 */
public record OrderResponse(
        UUID id,
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
        List<OrderItemResponse> items) {

    /**
     * Creates a complete response from an order aggregate.
     */
    static OrderResponse from(Order order) {
        return new OrderResponse(
                order.publicId(), order.orderNumber(), order.source(), order.status(), order.customerName(),
                order.customerPhone(), order.customerEmail(), order.note(), order.totalCents(),
                order.externalOrderId(), order.placedAt(), order.importedAt(), order.acceptedAt(),
                order.inPreparationAt(), order.readyAt(), order.completedAt(), order.cancelledAt(),
                order.items().stream().map(OrderItemResponse::from).toList());
    }

    /**
     * Represents an ordered product and its captured configuration.
     */
    public record OrderItemResponse(
            UUID id,
            UUID productId,
            String productNameSnapshot,
            OrderItemProductType productType,
            String imageUrl,
            int quantity,
            int basePriceCents,
            int unitPriceCents,
            int lineTotalCents,
            String purchaseModeId,
            String purchaseModeLabel,
            Integer purchaseModeQuantity,
            OrderItemAllocationType allocationType,
            String rawKey,
            List<ChoiceSelectionResponse> choiceSelections,
            List<ChoiceAllocationResponse> choiceAllocations,
            List<IngredientSelectionResponse> ingredientSelections) {

        /**
         * Creates an item response from an order item snapshot.
         */
        static OrderItemResponse from(OrderItem item) {
            return new OrderItemResponse(
                    item.publicId(), item.productId(), item.productNameSnapshot(), item.productType(),
                    item.imageUrl(), item.quantity(), item.basePriceCents(), item.unitPriceCents(),
                    item.lineTotalCents(), item.purchaseModeId(), item.purchaseModeLabel(),
                    item.purchaseModeQuantity(), item.allocationType(), item.rawKey(),
                    item.choiceSelections().stream().map(value -> new ChoiceSelectionResponse(
                            value.choiceId(), value.choiceName(), value.groupLabel())).toList(),
                    item.choiceAllocations().stream().map(value -> new ChoiceAllocationResponse(
                            value.choiceId(), value.choiceName(), value.quantity())).toList(),
                    item.ingredientSelections().stream().map(value -> new IngredientSelectionResponse(
                            value.ingredientId(), value.ingredientName(), value.quantity(), value.defaultQuantity(),
                            value.extraPriceCents())).toList());
        }
    }

    /**
     * Represents one selected product choice in an order response.
     */
    public record ChoiceSelectionResponse(String choiceId, String choiceName, String groupLabel) {
    }

    /**
     * Represents one allocated product choice in an order response.
     */
    public record ChoiceAllocationResponse(String choiceId, String choiceName, int quantity) {
    }

    /**
     * Represents one selected ingredient in an order response.
     */
    public record IngredientSelectionResponse(
            String ingredientId,
            String ingredientName,
            int quantity,
            int defaultQuantity,
            int extraPriceCents) {
    }
}
