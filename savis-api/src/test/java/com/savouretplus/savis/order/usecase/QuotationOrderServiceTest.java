package com.savouretplus.savis.order.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.order.api.QuotationOrderApi;
import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.domain.OrderStatus;
import com.savouretplus.savis.order.port.OrderNumberGenerator;
import com.savouretplus.savis.order.port.OrderRepository;

@ExtendWith(MockitoExtension.class)
class QuotationOrderServiceTest {
    private static final Instant NOW = Instant.parse("2026-10-12T15:00:00Z");
    private static final UUID QUOTATION_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");

    @Mock OrderRepository repository;
    @Mock OrderNumberGenerator numbers;

    @Test
    void createsAnAcceptedOrderFromSnapshotsWithoutRepricing() {
        when(repository.findBySourceAndExternalOrderId(OrderSource.QUOTATION, QUOTATION_ID))
                .thenReturn(Optional.empty());
        when(numbers.next(OrderSource.QUOTATION)).thenReturn("ADM-00000042");
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UUID createdId = service().create(snapshot());

        ArgumentCaptor<Order> order = ArgumentCaptor.forClass(Order.class);
        verify(repository).save(order.capture());
        assertEquals(createdId, order.getValue().publicId());
        assertEquals(OrderSource.QUOTATION, order.getValue().source());
        assertEquals(OrderStatus.ACCEPTED, order.getValue().status());
        assertEquals(1200, order.getValue().items().getFirst().unitPriceCents());
        assertEquals(2450, order.getValue().totalCents());
        assertEquals(QUOTATION_ID, order.getValue().externalOrderId());
    }

    private QuotationOrderService service() {
        return new QuotationOrderService(repository, numbers, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private QuotationOrderApi.QuotationSnapshot snapshot() {
        return new QuotationOrderApi.QuotationSnapshot(
                QUOTATION_ID, "Ada", "+15145550100", "ada@example.com", null,
                "Offre complète", 100, 150, 2450,
                List.of(new QuotationOrderApi.Item(
                        UUID.randomUUID(), "Installation", "STANDARD", null,
                        2, 1200, 1200, 2400, "service", "Service", 1, "NONE",
                        List.of(), List.of(), List.of())));
    }
}
