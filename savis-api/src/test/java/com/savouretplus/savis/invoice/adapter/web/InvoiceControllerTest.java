package com.savouretplus.savis.invoice.adapter.web;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import com.savouretplus.savis.invoice.domain.Invoice;
import com.savouretplus.savis.invoice.domain.InvoiceItem;
import com.savouretplus.savis.invoice.domain.InvoiceStatus;
import com.savouretplus.savis.invoice.usecase.GenerateInvoiceDocumentUseCase;
import com.savouretplus.savis.invoice.usecase.GeneratedInvoiceDocument;
import com.savouretplus.savis.invoice.usecase.InvoiceService;

@ExtendWith(MockitoExtension.class)
class InvoiceControllerTest {
    private static final UUID INVOICE_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");

    @Mock InvoiceService invoices;
    @Mock GenerateInvoiceDocumentUseCase documents;

    @Test
    void createsDraftFromOrderRequest() {
        UUID orderId = UUID.randomUUID();
        when(invoices.createFromOrder(orderId)).thenReturn(draft(orderId));

        InvoiceResponse response = new InvoiceController(invoices, documents)
                .create(new CreateInvoiceRequest(orderId));

        verify(invoices).createFromOrder(orderId);
        assertEquals(orderId, response.sourceOrderId());
    }

    @Test
    void exposesFinalPdfAsNonCachedAttachment() {
        byte[] content = { 1, 2, 3 };
        when(documents.generate(INVOICE_ID))
                .thenReturn(new GeneratedInvoiceDocument("facture-FAC-00000001.pdf", content));

        var response = new InvoiceController(invoices, documents).document(INVOICE_ID);

        assertEquals(MediaType.APPLICATION_PDF, response.getHeaders().getContentType());
        assertEquals("attachment; filename=\"facture-FAC-00000001.pdf\"",
                response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION));
        assertEquals("no-store", response.getHeaders().getCacheControl());
        assertArrayEquals(content, response.getBody());
    }

    private Invoice draft(UUID orderId) {
        Instant now = Instant.parse("2026-10-13T12:00:00Z");
        InvoiceItem item = new InvoiceItem(
                null, UUID.randomUUID(), UUID.randomUUID(), "Service", "STANDARD", null,
                1, 1000, 1000, 1000, null, null, null, "NONE",
                List.of(), List.of(), List.of());
        return new Invoice(
                null, INVOICE_ID, null, orderId, "ADM-00000001", InvoiceStatus.DRAFT,
                "Ada", "+15145550100", null, null, null,
                0, 0, 0, 0, 1000, now, now, null, null, List.of(item));
    }
}
