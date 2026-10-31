package com.savouretplus.savis.sales.invoice.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.sales.invoice.domain.Invoice;
import com.savouretplus.savis.sales.invoice.domain.InvoiceItem;
import com.savouretplus.savis.sales.invoice.domain.InvoiceStatus;
import com.savouretplus.savis.sales.invoice.port.InvoiceNumberGenerator;
import com.savouretplus.savis.sales.invoice.port.InvoiceRepository;
import com.savouretplus.savis.sales.order.api.OrderInvoicingApi;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {
    private static final Instant NOW = Instant.parse("2026-10-13T12:00:00Z");
    private static final UUID ORDER_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID INVOICE_ID = UUID.fromString("20000000-0000-4000-8000-000000000002");

    @Mock InvoiceRepository repository;
    @Mock InvoiceNumberGenerator numbers;
    @Mock OrderInvoicingApi orders;

    @Test
    void createsFaithfulSnapshotWithoutRecalculatingExternalPrices() {
        when(orders.snapshotForInvoice(ORDER_ID)).thenReturn(orderSnapshot());
        when(repository.findBySourceOrderId(ORDER_ID)).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Invoice invoice = service().createFromOrder(ORDER_ID);

        assertEquals(2450, invoice.totalCents());
        assertEquals(2400, invoice.subtotalCents());
        assertEquals(1200, invoice.items().getFirst().unitPriceCents());
        assertEquals("Vanille", invoice.items().getFirst().choices().getFirst().name());
        assertEquals(0, invoice.taxCents());
        assertEquals(InvoiceStatus.DRAFT, invoice.status());
    }

    @Test
    void returnsExistingInvoiceForTheSameLockedOrder() {
        Invoice existing = draft();
        when(orders.snapshotForInvoice(ORDER_ID)).thenReturn(orderSnapshot());
        when(repository.findBySourceOrderId(ORDER_ID)).thenReturn(Optional.of(existing));

        Invoice result = service().createFromOrder(ORDER_ID);

        assertSame(existing, result);
        verify(repository, never()).save(any());
    }

    @Test
    void assignsNumberOnlyWhenIssuingAndRejectsLaterUpdates() {
        Invoice draft = draft();
        when(repository.findByPublicIdForUpdate(INVOICE_ID)).thenReturn(Optional.of(draft));
        when(numbers.next()).thenReturn("FAC-00000001");
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Invoice issued = service().issue(INVOICE_ID);

        assertEquals("FAC-00000001", issued.invoiceNumber());
        assertEquals(InvoiceStatus.ISSUED, issued.status());
        when(repository.findByPublicIdForUpdate(INVOICE_ID)).thenReturn(Optional.of(issued));
        assertThrows(IllegalStateException.class, () -> service().update(INVOICE_ID, updateCommand()));
        assertSame(issued, service().issue(INVOICE_ID));
        verify(numbers, times(1)).next();
    }

    @Test
    void cancellingAnAlreadyCancelledInvoiceIsIdempotent() {
        Invoice cancelled = draft().cancel(NOW.plusSeconds(60));
        when(repository.findByPublicIdForUpdate(INVOICE_ID)).thenReturn(Optional.of(cancelled));

        Invoice result = service().cancel(INVOICE_ID);

        assertSame(cancelled, result);
        verify(repository, never()).save(any());
    }

    private InvoiceService service() {
        return new InvoiceService(repository, numbers, orders, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private UpdateInvoiceCommand updateCommand() {
        return new UpdateInvoiceCommand("Ada", "+15145550100", null, null, null, 100, 150, 0, 0);
    }

    private OrderInvoicingApi.OrderSnapshot orderSnapshot() {
        return new OrderInvoicingApi.OrderSnapshot(
                ORDER_ID, "ADM-00000001", "Ada", "+15145550100", "ada@example.com", null,
                "Snapshot accepté", 100, 150, 2450,
                List.of(new OrderInvoicingApi.Item(
                        UUID.randomUUID(), UUID.randomUUID(), "Service", "SINGLE_CHOICE", null,
                        2, 1200, 1200, 2400, "unit", "Unité", 1, "SINGLE_CHOICE",
                        List.of(new OrderInvoicingApi.Choice("vanilla", "Vanille", "Style")),
                        List.of(), List.of())));
    }

    private Invoice draft() {
        InvoiceItem item = new InvoiceItem(
                null, UUID.randomUUID(), UUID.randomUUID(), "Service", "STANDARD", null,
                2, 1200, 1200, 2400, "unit", "Unité", 1, "NONE",
                List.of(), List.of(), List.of());
        return new Invoice(
                1L, INVOICE_ID, null, ORDER_ID, "ADM-00000001", InvoiceStatus.DRAFT,
                "Ada", "+15145550100", null, null, null,
                100, 150, 0, 0, 2450, NOW, NOW, null, null, List.of(item));
    }
}
