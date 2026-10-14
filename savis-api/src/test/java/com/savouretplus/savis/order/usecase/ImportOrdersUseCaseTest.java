package com.savouretplus.savis.order.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderItem;
import com.savouretplus.savis.order.domain.OrderItemAllocationType;
import com.savouretplus.savis.order.domain.OrderItemProductType;
import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.domain.OrderStatus;
import com.savouretplus.savis.order.port.OrderInbox;
import com.savouretplus.savis.order.port.OrderNumberGenerator;
import com.savouretplus.savis.order.port.OrderRepository;
import com.savouretplus.savis.order.port.PendingCustomerOrder;

@ExtendWith(MockitoExtension.class)
class ImportOrdersUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-08-08T15:00:00Z");
    private static final UUID EXTERNAL_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");

    @Mock OrderInbox inbox;
    @Mock CustomerOrderImportMapper mapper;
    @Mock OrderRepository orders;
    @Mock OrderNumberGenerator orderNumbers;

    private ImportOrdersUseCase useCase;
    private PendingCustomerOrder source;

    @BeforeEach
    void setUp() {
        useCase = new ImportOrdersUseCase(
                inbox, mapper, orders, orderNumbers, Clock.fixed(NOW, ZoneOffset.UTC));
        source = new PendingCustomerOrder(
                EXTERNAL_ID, "Ada", "514", null, null, "new", "savouretplus", 1200,
                List.of(), NOW, Map.of());
        when(inbox.isEnabled()).thenReturn(true);
        when(inbox.fetchPending()).thenReturn(List.of(source));
    }

    @Test
    void importsAndAcknowledgesANewPendingOrder() {
        OrderItem item = new OrderItem(
                null, UUID.randomUUID(), UUID.randomUUID(), "Produit", OrderItemProductType.STANDARD,
                null, 1, 1200, 1200, 1200, "unit", "Unité", 1,
                OrderItemAllocationType.NONE, null, List.of(), List.of(), List.of());
        Order mapped = new Order(
                null, UUID.randomUUID(), "WEB-00000001", OrderSource.SAVOURETPLUS_WEB, OrderStatus.NEW,
                "Ada", "514", null, null, 1200, EXTERNAL_ID, NOW, NOW,
                null, null, null, null, null, List.of(item), Map.of());
        when(orderNumbers.next(OrderSource.SAVOURETPLUS_WEB)).thenReturn("WEB-00000001");
        when(mapper.map(source, "WEB-00000001", NOW)).thenReturn(mapped);

        var result = useCase.execute();

        assertEquals(1, result.importedCount());
        assertEquals(0, result.alreadyImportedCount());
        verify(orders).save(mapped);
        verify(inbox).markSynced(EXTERNAL_ID);
    }

    @Test
    void acknowledgesButDoesNotReimportAnExistingExternalOrder() {
        when(orders.existsBySourceAndExternalOrderId(OrderSource.SAVOURETPLUS_WEB, EXTERNAL_ID))
                .thenReturn(true);

        var result = useCase.execute();

        assertEquals(0, result.importedCount());
        assertEquals(1, result.alreadyImportedCount());
        verify(mapper, never()).map(any(), any(), any());
        verify(orders, never()).save(any());
        verify(inbox).markSynced(EXTERNAL_ID);
    }

    @Test
    void marksMalformedOrdersAsFailedAndContinuesReporting() {
        when(orderNumbers.next(OrderSource.SAVOURETPLUS_WEB)).thenReturn("WEB-00000001");
        when(mapper.map(source, "WEB-00000001", NOW)).thenThrow(new IllegalArgumentException("items invalides"));

        var result = useCase.execute();

        assertEquals(1, result.failedCount());
        assertEquals("items invalides", result.failures().getFirst().message());
        verify(inbox).markFailed(EXTERNAL_ID, "items invalides");
        verify(orders, never()).save(any());
    }
}
