package com.savouretplus.savis.order.usecase;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderItem;
import com.savouretplus.savis.order.domain.OrderItemChoiceAllocation;
import com.savouretplus.savis.order.domain.OrderItemChoiceSelection;
import com.savouretplus.savis.order.domain.OrderItemIngredientSelection;
import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.domain.OrderStatus;
import com.savouretplus.savis.order.port.OrderCatalog;
import com.savouretplus.savis.order.port.OrderNumberGenerator;
import com.savouretplus.savis.order.port.OrderRepository;

import lombok.AllArgsConstructor;

/**
 * Coordinates administrative order creation, queries, and lifecycle changes.
 */
@Service
@Transactional
@AllArgsConstructor
public class OrderService {
    private final OrderRepository repository;
    private final OrderCatalog catalog;
    private final OrderNumberGenerator orderNumbers;
    private final Clock clock;

    /**
     * Creates and persists an administrative order from current catalog products.
     */
    public Order create(CreateOrderCommand command) {
        if (command == null || command.items().isEmpty()) {
            throw new IllegalArgumentException("La commande doit contenir au moins un item");
        }

        List<OrderItem> items = command.items().stream().map(this::createItem).toList();
        int totalCents = items.stream().mapToInt(OrderItem::lineTotalCents).reduce(0, this::addExact);
        Instant now = Instant.now(clock);
        Order order = new Order(
                null,
                UUID.randomUUID(),
                orderNumbers.next(OrderSource.ADMIN),
                OrderSource.ADMIN,
                OrderStatus.NEW,
                command.customerName(),
                command.customerPhone(),
                blankToNull(command.customerEmail()),
                blankToNull(command.note()),
                totalCents,
                null,
                now,
                now,
                null, null, null, null, null,
                items,
                Map.of());
        return repository.save(order);
    }

    /**
     * Returns all orders for administration views.
     */
    @Transactional(readOnly = true)
    public List<Order> list() {
        return repository.findAll();
    }

    /**
     * Returns an order by its public identifier.
     */
    @Transactional(readOnly = true)
    public Order get(UUID orderId) {
        return repository.findByPublicId(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
    }

    /**
     * Applies a valid lifecycle transition and persists the resulting aggregate.
     */
    public Order updateStatus(UUID orderId, OrderStatus status) {
        Order changed = get(orderId).changeStatus(status, Instant.now(clock));
        return repository.save(changed);
    }

    private OrderItem createItem(CreateOrderCommand.Item command) {
        if (command == null || command.quantity() <= 0) {
            throw new IllegalArgumentException("La quantité commandée doit être supérieure à zéro");
        }
        OrderCatalog.ProductSnapshot snapshot = catalog.snapshot(selection(command));
        int lineTotalCents;
        try {
            lineTotalCents = Math.multiplyExact(snapshot.unitPriceCents(), command.quantity());
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("Le total de ligne dépasse la limite permise", exception);
        }

        OrderCatalog.PurchaseMode mode = snapshot.purchaseMode();
        OrderCatalog.ChoiceSelection choice = snapshot.choiceSelection();
        return new OrderItem(
                null,
                UUID.randomUUID(),
                snapshot.productId(),
                snapshot.productName(),
                snapshot.productType(),
                snapshot.imageUrl(),
                command.quantity(),
                snapshot.basePriceCents(),
                snapshot.unitPriceCents(),
                lineTotalCents,
                mode.code(),
                mode.label(),
                mode.quantity(),
                mode.allocationType(),
                null,
                choice == null ? List.of() : List.of(new OrderItemChoiceSelection(
                        null, choice.code(), choice.name(), choice.groupLabel())),
                snapshot.choiceAllocations().stream()
                        .map(value -> new OrderItemChoiceAllocation(
                                null, value.code(), value.name(), value.quantity()))
                        .toList(),
                snapshot.ingredientSelections().stream()
                        .map(value -> new OrderItemIngredientSelection(
                                null, value.code(), value.name(), value.quantity(),
                                value.defaultQuantity(), value.extraPriceCents()))
                        .toList());
    }

    private int addExact(int left, int right) {
        try {
            return Math.addExact(left, right);
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("Le total de la commande dépasse la limite permise", exception);
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private OrderCatalog.ProductSelection selection(CreateOrderCommand.Item command) {
        return new OrderCatalog.ProductSelection(
                command.productId(),
                command.purchaseModeCode(),
                command.choiceCode(),
                command.allocations().stream()
                        .map(value -> new OrderCatalog.ChoiceAllocation(
                                value.choiceCode(), value.quantity()))
                        .toList(),
                command.ingredients().stream()
                        .map(value -> new OrderCatalog.IngredientSelection(
                                value.ingredientCode(), value.quantity()))
                        .toList());
    }

}
