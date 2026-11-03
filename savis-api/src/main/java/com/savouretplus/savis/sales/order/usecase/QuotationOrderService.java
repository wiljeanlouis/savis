package com.savouretplus.savis.sales.order.usecase;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.sales.order.api.QuotationOrderApi;
import com.savouretplus.savis.sales.order.domain.Order;
import com.savouretplus.savis.sales.order.domain.OrderAddress;
import com.savouretplus.savis.sales.order.domain.OrderItem;
import com.savouretplus.savis.sales.order.domain.OrderItemAllocationType;
import com.savouretplus.savis.sales.order.domain.OrderItemChoiceAllocation;
import com.savouretplus.savis.sales.order.domain.OrderItemChoiceSelection;
import com.savouretplus.savis.sales.order.domain.OrderItemIngredientSelection;
import com.savouretplus.savis.sales.order.domain.OrderItemProductType;
import com.savouretplus.savis.sales.order.domain.OrderSource;
import com.savouretplus.savis.sales.order.domain.OrderStatus;
import com.savouretplus.savis.sales.order.port.OrderNumberGenerator;
import com.savouretplus.savis.sales.order.port.OrderRepository;

import lombok.AllArgsConstructor;

/**
 * Creates idempotent orders from accepted quotation snapshots.
 */
@Service
@AllArgsConstructor
public class QuotationOrderService implements QuotationOrderApi {
    private final OrderRepository orders;
    private final OrderNumberGenerator numbers;
    private final Clock clock;

    /**
     * Copies accepted commercial terms without consulting the current catalog.
     */
    @Override
    @Transactional
    public UUID create(QuotationSnapshot quotation) {
        if (quotation == null || quotation.quotationId() == null) {
            throw new IllegalArgumentException("La soumission à convertir est requise");
        }
        return orders.findBySourceAndExternalOrderId(OrderSource.QUOTATION, quotation.quotationId())
                .map(Order::publicId)
                .orElseGet(() -> createOrder(quotation).publicId());
    }

    private Order createOrder(QuotationSnapshot quotation) {
        Instant now = clock.instant();
        Order order = new Order(
                null,
                null,
                numbers.next(OrderSource.QUOTATION),
                OrderSource.QUOTATION,
                OrderStatus.ACCEPTED,
                quotation.customerName(),
                quotation.customerPhone(),
                quotation.customerEmail(),
                address(quotation.address()),
                quotation.note(),
                quotation.discountCents(),
                quotation.deliveryFeeCents(),
                quotation.totalCents(),
                quotation.quotationId(),
                now,
                now,
                now,
                null,
                null,
                null,
                null,
                quotation.items().stream().map(this::item).toList(),
                Map.of("quotationId", quotation.quotationId().toString()));
        return orders.save(order);
    }

    private OrderAddress address(Address value) {
        return value == null ? null : new OrderAddress(
                value.line1(), value.line2(), value.city(), value.province(), value.postalCode());
    }

    private OrderItem item(Item value) {
        return new OrderItem(
                null,
                null,
                value.productId(),
                value.productName(),
                OrderItemProductType.valueOf(value.productType()),
                value.imageUrl(),
                value.quantity(),
                value.basePriceCents(),
                value.unitPriceCents(),
                value.lineTotalCents(),
                value.purchaseModeId(),
                value.purchaseModeLabel(),
                value.purchaseModeQuantity(),
                OrderItemAllocationType.valueOf(value.allocationType()),
                null,
                value.choices().stream().map(choice -> new OrderItemChoiceSelection(
                        null, choice.id(), choice.name(), choice.groupLabel())).toList(),
                value.allocations().stream().map(allocation -> new OrderItemChoiceAllocation(
                        null, allocation.id(), allocation.name(), allocation.quantity())).toList(),
                value.ingredients().stream().map(ingredient -> new OrderItemIngredientSelection(
                        null, ingredient.id(), ingredient.name(), ingredient.quantity(),
                        ingredient.defaultQuantity(), ingredient.extraPriceCents())).toList());
    }
}
