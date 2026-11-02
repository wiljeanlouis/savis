package com.savouretplus.savis.sales.workspace.adapter.web;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.util.List;
import java.util.HashSet;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.savouretplus.savis.sales.invoice.api.workspace.SalesInvoiceWorkspaceApi;
import com.savouretplus.savis.sales.order.api.workspace.SalesOrderWorkspaceApi;
import com.savouretplus.savis.sales.quotation.api.workspace.SalesQuotationWorkspaceApi;
import com.savouretplus.savis.sales.workspace.usecase.SalesWorkspaceService;

class SalesWorkspaceControllerTest {
    private final SalesQuotationWorkspaceApi quotations = mock(SalesQuotationWorkspaceApi.class);
    private final SalesOrderWorkspaceApi orders = mock(SalesOrderWorkspaceApi.class);
    private final SalesInvoiceWorkspaceApi invoices = mock(SalesInvoiceWorkspaceApi.class);
    private final SalesWorkspaceService service = new SalesWorkspaceService(quotations, orders, invoices);
    private final org.springframework.test.web.servlet.MockMvc mvc =
            MockMvcBuilders.standaloneSetup(new SalesWorkspaceController(service)).build();

    @BeforeEach
    void clearSnapshots() {
        when(quotations.requests()).thenReturn(List.of());
        when(quotations.quotations()).thenReturn(List.of());
        when(orders.orders()).thenReturn(List.of());
        when(invoices.invoices()).thenReturn(List.of());
    }

    @Test
    void groupsRequestBranchesAndTheirOrderAndInvoice() throws Exception {
        UUID requestId = UUID.randomUUID();
        UUID acceptedId = UUID.randomUUID();
        UUID pendingId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        Instant now = Instant.parse("2026-10-31T12:00:00Z");
        when(quotations.requests()).thenReturn(List.of(
                new SalesQuotationWorkspaceApi.Request(
                        requestId, "Marie Tremblay", "5145550123", null, "QUOTED", now, now)));
        when(quotations.quotations()).thenReturn(List.of(
                new SalesQuotationWorkspaceApi.Quotation(
                        acceptedId, "SOU-0018", "ACCEPTED", "Marie Tremblay", "5145550123", null,
                        null, 12000, now, requestId, orderId),
                new SalesQuotationWorkspaceApi.Quotation(
                        pendingId, "SOU-0019", "SENT", "Marie Tremblay", "5145550123", null,
                        null, 4500, now, requestId, null)));
        when(orders.orders()).thenReturn(List.of(
                new SalesOrderWorkspaceApi.Order(
                        orderId, "CMD-0012", "QUOTATION", acceptedId, "COMPLETED", "Marie Tremblay",
                        "5145550123", null, null, 12000, now)));
        when(invoices.invoices()).thenReturn(List.of(
                new SalesInvoiceWorkspaceApi.Invoice(
                        invoiceId, orderId, "FAC-0009", "ISSUED", "UNPAID", null,
                        "Marie Tremblay", "5145550123", null, null, 12000, now)));

        var page = service.list(0, 20, "");
        assertEquals(1, page.totalElements());
        assertEquals(4, page.content().getFirst().documentCount());
        assertEquals("1 branche facturée · 1 soumission en attente", page.content().getFirst().situation());

        mvc.perform(get("/api/sales/workspace/{dossierId}", "REQUEST:" + requestId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.root.children.length()").value(2))
                .andExpect(jsonPath("$.root.children[0].children[0].children[0].type").value("INVOICE"));
    }

    @Test
    void filtersDossiersByTheirCommercialActionState() {
        UUID draftQuoteId = UUID.randomUUID();
        UUID acceptedQuoteId = UUID.randomUUID();
        UUID completedOrderId = UUID.randomUUID();
        UUID paidInvoiceId = UUID.randomUUID();
        Instant now = Instant.parse("2026-10-31T12:00:00Z");
        when(quotations.requests()).thenReturn(List.of());
        when(quotations.quotations()).thenReturn(List.of(
                new SalesQuotationWorkspaceApi.Quotation(
                        draftQuoteId, "SOU-5001", "DRAFT", "Client A", "5145550123", null,
                        null, 1500, now, null, null),
                new SalesQuotationWorkspaceApi.Quotation(
                        acceptedQuoteId, "SOU-5002", "ACCEPTED", "Client B", "5145550123", null,
                        null, 2500, now, completedOrderId, completedOrderId)));
        when(orders.orders()).thenReturn(List.of(
                new SalesOrderWorkspaceApi.Order(
                        completedOrderId, "CMD-5002", "QUOTATION", acceptedQuoteId, "COMPLETED",
                        "Client B", "5145550123", null, null, 2500, now),
                new SalesOrderWorkspaceApi.Order(
                        UUID.randomUUID(), "CMD-5003", "QUOTATION", UUID.randomUUID(), "COMPLETED",
                        "Client C", "5145550123", null, null, 2500, now)));
        when(invoices.invoices()).thenReturn(List.of(
                new SalesInvoiceWorkspaceApi.Invoice(
                        paidInvoiceId, completedOrderId, "FAC-1000", "ISSUED", "PAID", now,
                        "Client B", "5145550123", null, null, 2500, now)));

        assertEquals(1, service.list(0, 20, "", "ACTION_REQUIRED").totalElements());
        assertEquals(2, service.list(0, 20, "", "FINISHED").totalElements());
        assertEquals(3, service.list(0, 20, "", "ALL").totalElements());
    }

    @Test
    void treatsPaidIssuedInvoicesAsFinishedEvenWhenTheCommercialChainIsStillOpen() {
        UUID requestId = UUID.randomUUID();
        UUID quotationId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        Instant now = Instant.parse("2026-10-31T12:00:00Z");

        when(quotations.requests()).thenReturn(List.of(
                new SalesQuotationWorkspaceApi.Request(
                        requestId, "Client D", "5145550123", null, "QUOTED", now, now)));
        when(quotations.quotations()).thenReturn(List.of(
                new SalesQuotationWorkspaceApi.Quotation(
                        quotationId, "SOU-7001", "ACCEPTED", "Client D", "5145550123", null,
                        null, 4200, now, requestId, orderId)));
        when(orders.orders()).thenReturn(List.of(
                new SalesOrderWorkspaceApi.Order(
                        orderId, "CMD-7001", "QUOTATION", quotationId, "COMPLETED",
                        "Client D", "5145550123", null, null, 4200, now)));
        when(invoices.invoices()).thenReturn(List.of(
                new SalesInvoiceWorkspaceApi.Invoice(
                        invoiceId, orderId, "FAC-7001", "ISSUED", "PAID", now,
                        "Client D", "5145550123", null, null, 4200, now)));

        assertEquals(1, service.list(0, 20, "", "FINISHED").totalElements());
        assertEquals(0, service.list(0, 20, "", "ACTION_REQUIRED").totalElements());
    }

    @Test
    void keepsAutonomousDocumentsAndSameCustomerDossiersSeparateWithSearchAndPagination() {
        UUID requestId = UUID.randomUUID();
        UUID quotationId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        Instant now = Instant.parse("2026-10-31T12:00:00Z");
        when(quotations.requests()).thenReturn(List.of(
                new SalesQuotationWorkspaceApi.Request(
                        requestId, "Marie Tremblay", "5145550123", null, "RECEIVED", now, now)));
        when(quotations.quotations()).thenReturn(List.of(
                new SalesQuotationWorkspaceApi.Quotation(
                        quotationId, "SOU-0042", "DRAFT", "Marie Tremblay", "5145550123", null,
                        null, 4500, now, null, null)));
        when(orders.orders()).thenReturn(List.of(
                new SalesOrderWorkspaceApi.Order(
                        orderId, "CMD-0012", "ADMIN", null, "NEW", "Marie Tremblay",
                        "5145550123", null, null, 9000, now)));
        when(invoices.invoices()).thenReturn(List.of(
                new SalesInvoiceWorkspaceApi.Invoice(
                        invoiceId, UUID.randomUUID(), "FAC-0009", "ISSUED", "UNPAID", null,
                        "Marie Tremblay", "5145550123", null, null, 3000, now)));

        var firstPage = service.list(0, 2, "marie");
        var secondPage = service.list(1, 2, "marie");
        assertEquals(4, firstPage.totalElements());
        assertEquals(2, firstPage.content().size());
        assertEquals(2, secondPage.content().size());
        assertEquals(1, service.list(0, 20, "SOU-0042").totalElements());
        var ids = service.list(0, 20, "marie").content().stream()
                .map(SalesWorkspaceService.SalesWorkspaceSummary::id)
                .toList();
        assertEquals(4, new HashSet<>(ids).size());
    }

    @Test
    void exposesWarningsForMissingExplicitReferencesWithoutDroppingDocuments() throws Exception {
        UUID quotationId = UUID.randomUUID();
        UUID missingRequestId = UUID.randomUUID();
        UUID conflictingQuotationId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        Instant now = Instant.parse("2026-10-31T12:00:00Z");
        when(quotations.quotations()).thenReturn(List.of(
                new SalesQuotationWorkspaceApi.Quotation(
                        quotationId, "SOU-0099", "DRAFT", "Client", "5145550123", null,
                        null, 1000, now, missingRequestId, null),
                new SalesQuotationWorkspaceApi.Quotation(
                        conflictingQuotationId, "SOU-0100", "ACCEPTED", "Client", "5145550123", null,
                        null, 2000, now, null, orderId)));
        when(orders.orders()).thenReturn(List.of(
                new SalesOrderWorkspaceApi.Order(
                        orderId, "CMD-0010", "QUOTATION", UUID.randomUUID(), "ACCEPTED",
                        "Client", "5145550123", null, null, 2000, now)));

        assertEquals(3, service.list(0, 20, "").totalElements());
        mvc.perform(get("/api/sales/workspace/{dossierId}", "QUOTATION:" + quotationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.root.warnings[0]")
                        .value("La demande d’origine référencée est introuvable."));
        mvc.perform(get("/api/sales/workspace/{dossierId}", "ORDER:" + orderId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.root.warnings[0]")
                        .value("Les références de la soumission et de la commande sont incohérentes."));
    }
}
