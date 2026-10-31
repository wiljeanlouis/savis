package com.savouretplus.savis.sales.order.usecase;

import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.sales.order.api.OrderInvoicingApi;
import com.savouretplus.savis.sales.order.api.InvoiceSourceOrderNotFoundException;
import com.savouretplus.savis.sales.order.domain.Order;
import com.savouretplus.savis.sales.order.domain.OrderAddress;
import com.savouretplus.savis.sales.order.domain.OrderItem;
import com.savouretplus.savis.sales.order.domain.OrderStatus;
import com.savouretplus.savis.sales.order.port.OrderRepository;

import lombok.AllArgsConstructor;

/**
 * Provides locked order snapshots to the invoicing module.
 */
@Service
@AllArgsConstructor
public class OrderInvoicingService implements OrderInvoicingApi {
    private static final Set<OrderStatus> INVOICEABLE_STATUSES = Set.of(
            OrderStatus.ACCEPTED,
            OrderStatus.IN_PREPARATION,
            OrderStatus.READY,
            OrderStatus.COMPLETED);

    private final OrderRepository orders;

    /**
     * Locks an eligible order for the duration of invoice creation and copies only persisted snapshots.
     */
    @Override
    @Transactional
    public OrderSnapshot snapshotForInvoice(UUID orderId) {
        Order order = orders.findByPublicIdForUpdate(orderId)
                .orElseThrow(() -> new InvoiceSourceOrderNotFoundException(orderId));
        if (!INVOICEABLE_STATUSES.contains(order.status())) {
            throw new IllegalStateException(
                    "La commande doit être acceptée avant de pouvoir être facturée");
        }
        return snapshot(order);
    }

    private OrderSnapshot snapshot(Order order) {
        OrderAddress address = order.customerAddress();
        return new OrderSnapshot(
                order.publicId(),
                order.orderNumber(),
                order.customerName(),
                order.customerPhone(),
                order.customerEmail(),
                address == null ? null : new Address(
                        address.line1(), address.line2(), address.city(), address.province(), address.postalCode()),
                order.note(),
                order.discountCents(),
                order.deliveryFeeCents(),
                order.totalCents(),
                order.items().stream().map(this::item).toList());
    }

    private Item item(OrderItem item) {
        return new Item(
                item.publicId(), item.productId(), item.productNameSnapshot(), item.productType().name(),
                item.imageUrl(), item.quantity(), item.basePriceCents(), item.unitPriceCents(),
                item.lineTotalCents(), item.purchaseModeId(), item.purchaseModeLabel(),
                item.purchaseModeQuantity(), item.allocationType().name(),
                item.choiceSelections().stream().map(value -> new Choice(
                        value.choiceId(), value.choiceName(), value.groupLabel())).toList(),
                item.choiceAllocations().stream().map(value -> new Allocation(
                        value.choiceId(), value.choiceName(), value.quantity())).toList(),
                item.ingredientSelections().stream().map(value -> new Ingredient(
                        value.ingredientId(), value.ingredientName(), value.quantity(),
                        value.defaultQuantity(), value.extraPriceCents())).toList());
    }
}
