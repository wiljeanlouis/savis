package com.savouretplus.savis.order.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.domain.OrderStatus;
import com.savouretplus.savis.order.port.OrderRepository;

@ExtendWith(MockitoExtension.class)
class OrderInvoicingServiceTest {
    private static final UUID ORDER_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");

    @Mock OrderRepository repository;

    @Test
    void locksEligibleOrderBeforeExposingSnapshot() {
        when(repository.findByPublicIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order(OrderStatus.ACCEPTED)));

        var snapshot = new OrderInvoicingService(repository).snapshotForInvoice(ORDER_ID);

        verify(repository).findByPublicIdForUpdate(ORDER_ID);
        assertEquals("ADM-00000001", snapshot.orderNumber());
        assertEquals(2450, snapshot.totalCents());
    }

    @Test
    void rejectsOrdersThatHaveNotBeenAcceptedOrWereCancelled() {
        when(repository.findByPublicIdForUpdate(ORDER_ID))
                .thenReturn(Optional.of(order(OrderStatus.NEW)))
                .thenReturn(Optional.of(order(OrderStatus.CANCELLED)));

        OrderInvoicingService service = new OrderInvoicingService(repository);
        assertThrows(IllegalStateException.class, () -> service.snapshotForInvoice(ORDER_ID));
        assertThrows(IllegalStateException.class, () -> service.snapshotForInvoice(ORDER_ID));
    }

    private Order order(OrderStatus status) {
        Instant now = Instant.parse("2026-10-13T12:00:00Z");
        return new Order(
                1L, ORDER_ID, "ADM-00000001", OrderSource.ADMIN, status,
                "Ada", "+15145550100", null, null, null, 100, 150, 2450,
                null, now, now, status == OrderStatus.ACCEPTED ? now : null,
                null, null, null, status == OrderStatus.CANCELLED ? now : null,
                List.of(), Map.of());
    }
}
