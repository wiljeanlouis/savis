package com.savouretplus.savis.sales.workspace.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.savouretplus.savis.sales.invoice.api.workspace.SalesInvoiceWorkspaceApi;
import com.savouretplus.savis.sales.order.api.workspace.SalesOrderWorkspaceApi;
import com.savouretplus.savis.sales.quotation.api.workspace.SalesQuotationWorkspaceApi;
import com.savouretplus.savis.sales.workspace.domain.DocumentType;

class DossierAssemblerTest {
    private final SalesQuotationWorkspaceApi quotations = mock(SalesQuotationWorkspaceApi.class);
    private final SalesOrderWorkspaceApi orders = mock(SalesOrderWorkspaceApi.class);
    private final SalesInvoiceWorkspaceApi invoices = mock(SalesInvoiceWorkspaceApi.class);
    private final DossierAssembler assembler = new DossierAssembler(quotations, orders, invoices);

    @BeforeEach
    void clearSnapshots() {
        when(quotations.requests()).thenReturn(List.of());
        when(quotations.quotations()).thenReturn(List.of());
        when(orders.orders()).thenReturn(List.of());
        when(invoices.invoices()).thenReturn(List.of());
    }

    @Test
    void assemblesOwnedSnapshotsIntoRequestQuotationOrderAndInvoiceTree() {
        UUID requestId = UUID.randomUUID();
        UUID quotationId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        Instant now = Instant.parse("2026-10-31T12:00:00Z");

        when(quotations.requests()).thenReturn(List.of(new SalesQuotationWorkspaceApi.Request(
                requestId, "Client", null, null, "QUOTED", now, now)));
        when(quotations.quotations()).thenReturn(List.of(new SalesQuotationWorkspaceApi.Quotation(
                quotationId, "SOU-001", "ACCEPTED", "Client", null, null, "Description",
                12000, now, requestId, orderId)));
        when(orders.orders()).thenReturn(List.of(new SalesOrderWorkspaceApi.Order(
                orderId, "CMD-001", "QUOTATION", quotationId, "COMPLETED", "Client",
                null, null, null, 12000, now)));
        when(invoices.invoices()).thenReturn(List.of(new SalesInvoiceWorkspaceApi.Invoice(
                invoiceId, orderId, "FAC-001", "ISSUED", "PAID", now, now, "Client",
                null, null, null, 12000, now)));

        var dossier = assembler.assemble().getFirst();
        var root = dossier.root();
        var quotation = root.children().getFirst();
        var order = quotation.children().getFirst();
        var invoice = order.children().getFirst();

        assertEquals("REQUEST:" + requestId, dossier.id());
        assertEquals(DocumentType.QUOTATION, quotation.type());
        assertEquals(DocumentType.ORDER, order.type());
        assertEquals(DocumentType.INVOICE, invoice.type());
        assertEquals("ISSUED", invoice.status());
        assertEquals("PAID", invoice.paymentStatus());
        assertEquals(now, invoice.issuedAt());
        assertEquals(now, invoice.paidAt());
        assertEquals(0, invoice.children().size());
        assertEquals(3, dossier.documentCount());
        assertEquals("1 branche réglée", dossier.situation());
    }

    @Test
    void reportsMissingSourceSnapshotsOnTheAffectedDossier() {
        UUID quotationId = UUID.randomUUID();
        UUID missingRequestId = UUID.randomUUID();
        UUID missingOrderId = UUID.randomUUID();
        Instant now = Instant.parse("2026-10-31T12:00:00Z");

        when(quotations.quotations()).thenReturn(List.of(new SalesQuotationWorkspaceApi.Quotation(
                quotationId, "SOU-002", "ACCEPTED", "Client", null, null, null,
                12000, now, missingRequestId, missingOrderId)));

        var dossier = assembler.assemble().getFirst();

        assertEquals(
                "La demande d’origine référencée est introuvable.",
                dossier.root().warnings().getFirst());
        assertEquals(
                "La commande issue de cette soumission est introuvable.",
                dossier.root().warnings().get(1));
    }
}
