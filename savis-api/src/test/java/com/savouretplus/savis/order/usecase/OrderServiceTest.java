package com.savouretplus.savis.order.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderItemAllocationType;
import com.savouretplus.savis.order.domain.OrderItemProductType;
import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.domain.OrderStatus;
import com.savouretplus.savis.order.port.OrderCatalog;
import com.savouretplus.savis.order.port.OrderNumberGenerator;
import com.savouretplus.savis.order.port.OrderRepository;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    private static final Instant NOW = Instant.parse("2026-08-08T15:00:00Z");
    private static final UUID ORDER_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID PRODUCT_ID = UUID.fromString("20000000-0000-4000-8000-000000000002");

    @Mock OrderRepository repository;
    @Mock OrderCatalog catalog;
    @Mock OrderNumberGenerator orderNumbers;

    @Test
    void createsAnAdministrativeOrderFromCatalogSnapshots() {
        OrderCatalog.ProductSelection selection = new OrderCatalog.ProductSelection(
                PRODUCT_ID, "unit", "vanilla", List.of(), List.of());
        when(catalog.snapshot(selection)).thenReturn(new OrderCatalog.ProductSnapshot(
                PRODUCT_ID,
                "Cupcake",
                OrderItemProductType.SINGLE_CHOICE,
                "/cupcake.jpg",
                450,
                450,
                new OrderCatalog.PurchaseMode("unit", "Unité", 1, OrderItemAllocationType.SINGLE_CHOICE),
                new OrderCatalog.ChoiceSelection("vanilla", "Vanille", "Saveur"),
                List.of(),
                List.of()));
        when(orderNumbers.next(OrderSource.ADMIN)).thenReturn("ADM-00000001");
        when(repository.save(org.mockito.ArgumentMatchers.any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        OrderService service = service();
        CreateOrderCommand command = new CreateOrderCommand(
                "Ada", "514", "ada@example.com", "Livrer à 15 h",
                List.of(new CreateOrderCommand.Item(
                        PRODUCT_ID, 3, "unit", "vanilla", List.of(), List.of())));

        Order created = service.create(command);

        assertEquals(OrderSource.ADMIN, created.source());
        assertEquals(OrderStatus.NEW, created.status());
        assertEquals("ADM-00000001", created.orderNumber());
        assertEquals(1350, created.totalCents());
        assertEquals(NOW, created.placedAt());
        assertEquals("Vanille", created.items().getFirst().choiceSelections().getFirst().choiceName());
        verify(repository).save(created);
    }

    @Test
    void acceptsANewOrderAndRecordsTheTimestamp() {
        Order initial = order(OrderStatus.NEW);
        when(repository.findByPublicId(ORDER_ID)).thenReturn(Optional.of(initial));
        when(repository.save(org.mockito.ArgumentMatchers.any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        OrderService service = service();

        Order changed = service.updateStatus(ORDER_ID, OrderStatus.ACCEPTED);

        assertEquals(OrderStatus.ACCEPTED, changed.status());
        assertEquals(NOW, changed.acceptedAt());
        verify(repository).save(changed);
    }

    @Test
    void rejectsSkippingFromNewDirectlyToReady() {
        when(repository.findByPublicId(ORDER_ID)).thenReturn(Optional.of(order(OrderStatus.NEW)));
        OrderService service = service();

        assertThrows(IllegalStateException.class, () -> service.updateStatus(ORDER_ID, OrderStatus.READY));
    }

    private Order order(OrderStatus status) {
        return new Order(
                1L, ORDER_ID, "WEB-00000001", OrderSource.SAVOURETPLUS_WEB, status,
                "Ada", "514", null, null, 1200, UUID.randomUUID(), NOW, NOW,
                null, null, null, null, null, List.of(), Map.of());
    }

    private OrderService service() {
        return new OrderService(repository, catalog, orderNumbers, Clock.fixed(NOW, ZoneOffset.UTC));
    }
}
