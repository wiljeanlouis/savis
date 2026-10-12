package com.savouretplus.savis.order.usecase;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
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
import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.domain.OrderStatus;
import com.savouretplus.savis.order.port.OrderDocumentRenderer;
import com.savouretplus.savis.order.port.OrderRepository;

@ExtendWith(MockitoExtension.class)
class GenerateOrderDocumentUseCaseTest {
    private static final UUID ORDER_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final Instant NOW = Instant.parse("2026-10-12T14:00:00Z");

    @Mock OrderRepository orders;
    @Mock OrderDocumentRenderer renderer;

    @Test
    void rendersTheRequestedOrderWithAStableDownloadName() {
        Order order = order();
        when(orders.findByPublicId(ORDER_ID)).thenReturn(Optional.of(order));
        when(renderer.render(order, OrderDocumentType.INVOICE, NOW)).thenReturn(new byte[] { 1, 2, 3 });
        GenerateOrderDocumentUseCase useCase = new GenerateOrderDocumentUseCase(
                orders, renderer, Clock.fixed(NOW, ZoneOffset.UTC));

        GeneratedOrderDocument result = useCase.generate(ORDER_ID, OrderDocumentType.INVOICE);

        assertEquals("facture-ADM-00000042.pdf", result.fileName());
        assertArrayEquals(new byte[] { 1, 2, 3 }, result.content());
        verify(renderer).render(order, OrderDocumentType.INVOICE, NOW);
    }

    private Order order() {
        return new Order(
                1L, ORDER_ID, "ADM-00000042", OrderSource.ADMIN, OrderStatus.NEW,
                "Ada", "514", null, null, 0, null, NOW, NOW,
                null, null, null, null, null, List.of(), Map.of());
    }
}
