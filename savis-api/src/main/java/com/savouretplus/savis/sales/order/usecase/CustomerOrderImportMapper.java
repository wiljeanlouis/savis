package com.savouretplus.savis.sales.order.usecase;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.sales.order.domain.CustomerContactNormalizer;
import com.savouretplus.savis.sales.order.domain.Order;
import com.savouretplus.savis.sales.order.domain.OrderItem;
import com.savouretplus.savis.sales.order.domain.OrderItemAllocationType;
import com.savouretplus.savis.sales.order.domain.OrderItemChoiceAllocation;
import com.savouretplus.savis.sales.order.domain.OrderItemChoiceSelection;
import com.savouretplus.savis.sales.order.domain.OrderItemIngredientSelection;
import com.savouretplus.savis.sales.order.domain.OrderItemProductType;
import com.savouretplus.savis.sales.order.domain.OrderSource;
import com.savouretplus.savis.sales.order.domain.OrderStatus;
import com.savouretplus.savis.sales.order.port.PendingCustomerOrder;

/**
 * Converts provider-neutral pending orders into normalized local aggregates.
 */
@Component
public class CustomerOrderImportMapper {

    /**
     * Creates an order aggregate from a validated external order snapshot.
     */
    public Order map(PendingCustomerOrder source, String orderNumber, Instant importedAt) {
        if (source == null || source.externalId() == null) {
            throw new IllegalArgumentException("La commande externe et son identifiant sont requis");
        }
        if (!"savouretplus".equalsIgnoreCase(source.externalSource())) {
            throw new IllegalArgumentException("Source externe non supportée: " + source.externalSource());
        }
        if (!"new".equalsIgnoreCase(source.externalStatus())) {
            throw new IllegalArgumentException("Statut externe non importable: " + source.externalStatus());
        }
        if (source.items().isEmpty()) {
            throw new IllegalArgumentException("La commande doit contenir au moins un item");
        }

        List<OrderItem> items = source.items().stream().map(this::mapItem).toList();
        int expectedTotal = Order.calculateTotalCents(
                items, source.discountCents(), source.deliveryFeeCents());
        if (source.totalCents() != expectedTotal) {
            throw new IllegalArgumentException("Le total de la commande externe est incohérent");
        }

        return new Order(
                null,
                UUID.randomUUID(),
                orderNumber,
                OrderSource.SAVOURETPLUS_WEB,
                OrderStatus.NEW,
                source.customerName(),
                CustomerContactNormalizer.normalizePhone(source.customerPhone()),
                blankToNull(source.customerEmail()),
                CustomerContactNormalizer.normalizeAddress(source.customerAddress()),
                blankToNull(source.note()),
                source.discountCents(),
                source.deliveryFeeCents(),
                source.totalCents(),
                source.externalId(),
                source.placedAt(),
                importedAt,
                null, null, null, null, null,
                items,
                source.rawPayload());
    }

    private OrderItem mapItem(PendingCustomerOrder.Item item) {
        int lineTotalCents;
        try {
            lineTotalCents = Math.multiplyExact(item.unitPriceCents(), item.quantity());
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("Le total de ligne dépasse la limite permise", exception);
        }

        PendingCustomerOrder.PurchaseMode purchaseMode = item.purchaseMode();
        List<OrderItemChoiceSelection> selections = item.selection() == null
                ? List.of()
                : List.of(new OrderItemChoiceSelection(
                        null,
                        item.selection().choiceId(),
                        item.selection().choiceName(),
                        item.selection().groupLabel()));
        List<OrderItemChoiceAllocation> allocations = item.allocations().stream()
                .map(value -> new OrderItemChoiceAllocation(
                        null, value.choiceId(), value.choiceName(), value.quantity()))
                .toList();
        List<OrderItemIngredientSelection> ingredients = item.ingredients().stream()
                .map(value -> new OrderItemIngredientSelection(
                        null, value.id(), value.name(), value.quantity(),
                        value.defaultQuantity(), value.extraPriceCents()))
                .toList();

        return new OrderItem(
                null,
                UUID.randomUUID(),
                item.productId(),
                item.name(),
                enumValue(OrderItemProductType.class, item.productType(), "productType"),
                item.imageUrl(),
                item.quantity(),
                item.basePriceCents() != null ? item.basePriceCents() : item.unitPriceCents(),
                item.unitPriceCents(),
                lineTotalCents,
                purchaseMode != null ? purchaseMode.id() : null,
                purchaseMode != null ? purchaseMode.label() : null,
                purchaseMode != null ? purchaseMode.quantity() : null,
                purchaseMode != null
                        ? enumValue(OrderItemAllocationType.class,
                                purchaseMode.allocationType(), "allocationType")
                        : OrderItemAllocationType.NONE,
                item.rawKey(),
                selections,
                allocations,
                ingredients);
    }

    private <E extends Enum<E>> E enumValue(Class<E> type, String value, String field) {
        try {
            return Enum.valueOf(type, value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new IllegalArgumentException("Valeur %s non supportée pour %s".formatted(value, field), exception);
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
