package com.savouretplus.savis.sales.invoice.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.savouretplus.savis.sales.invoice.domain.Invoice;
import com.savouretplus.savis.sales.invoice.domain.InvoiceStatus;
import com.savouretplus.savis.sales.invoice.port.InvoiceNumberGenerator;
import com.savouretplus.savis.sales.invoice.port.InvoiceRepository;
import com.savouretplus.savis.sales.order.domain.Order;
import com.savouretplus.savis.sales.order.domain.OrderItem;
import com.savouretplus.savis.sales.order.domain.OrderItemAllocationType;
import com.savouretplus.savis.sales.order.domain.OrderItemProductType;
import com.savouretplus.savis.sales.order.domain.OrderSource;
import com.savouretplus.savis.sales.order.domain.OrderStatus;
import com.savouretplus.savis.sales.order.port.OrderRepository;

@SpringBootTest
@ActiveProfiles("test")
class InvoiceConcurrencyTest {
    @Autowired InvoiceService service;
    @Autowired InvoiceRepository invoices;
    @Autowired OrderRepository orders;
    @MockitoBean InvoiceNumberGenerator numbers;

    @Test
    void serializesConcurrentCreationAndIssuance() throws Exception {
        UUID orderId = UUID.randomUUID();
        orders.save(order(orderId));

        List<Invoice> created = concurrently(() -> service.createFromOrder(orderId));

        assertEquals(created.get(0).publicId(), created.get(1).publicId());
        assertEquals(created.get(0).publicId(), invoices.findBySourceOrderId(orderId).orElseThrow().publicId());

        when(numbers.next()).thenReturn("FAC-00000001");
        UUID invoiceId = created.getFirst().publicId();
        List<Invoice> issued = concurrently(() -> service.issue(invoiceId));

        assertEquals(InvoiceStatus.ISSUED, issued.get(0).status());
        assertEquals("FAC-00000001", issued.get(0).invoiceNumber());
        assertEquals(issued.get(0).invoiceNumber(), issued.get(1).invoiceNumber());
        assertNotNull(invoices.findByPublicId(invoiceId).orElseThrow().issuedAt());
        verify(numbers, times(1)).next();
    }

    private <T> List<T> concurrently(Callable<T> operation) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        Callable<T> gated = () -> {
            ready.countDown();
            if (!start.await(10, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Le départ concurrent a expiré");
            }
            return operation.call();
        };
        try {
            Future<T> first = executor.submit(gated);
            Future<T> second = executor.submit(gated);
            assertTrue(ready.await(10, TimeUnit.SECONDS));
            start.countDown();
            return List.of(first.get(15, TimeUnit.SECONDS), second.get(15, TimeUnit.SECONDS));
        } finally {
            executor.shutdownNow();
        }
    }

    private Order order(UUID orderId) {
        Instant now = Instant.parse("2026-10-13T12:00:00Z");
        OrderItem item = new OrderItem(
                null, null, UUID.randomUUID(), "Service d'installation", OrderItemProductType.STANDARD,
                null, 2, 1200, 1200, 2400, "unit", "Unité", 1,
                OrderItemAllocationType.NONE, null, List.of(), List.of(), List.of());
        return new Order(
                null, orderId, "ADM-" + orderId.toString().substring(0, 8), OrderSource.ADMIN,
                OrderStatus.ACCEPTED, "Ada", "+15145550100", "ada@example.com", null,
                "Commande acceptée", 100, 150, 2450, null, now, now, now,
                null, null, null, null, List.of(item), Map.of());
    }
}
