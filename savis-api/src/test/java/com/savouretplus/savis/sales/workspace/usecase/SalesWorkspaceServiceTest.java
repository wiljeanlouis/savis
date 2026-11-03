package com.savouretplus.savis.sales.workspace.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.savouretplus.savis.sales.invoice.api.workspace.SalesInvoiceWorkspaceApi;
import com.savouretplus.savis.sales.order.api.workspace.SalesOrderWorkspaceApi;
import com.savouretplus.savis.sales.quotation.api.workspace.SalesQuotationWorkspaceApi;

class SalesWorkspaceServiceTest {
    private final SalesQuotationWorkspaceApi quotations = mock(SalesQuotationWorkspaceApi.class);
    private final SalesOrderWorkspaceApi orders = mock(SalesOrderWorkspaceApi.class);
    private final SalesInvoiceWorkspaceApi invoices = mock(SalesInvoiceWorkspaceApi.class);
    private final SalesWorkspaceService service = new SalesWorkspaceService(quotations, orders, invoices);

    @BeforeEach
    void clearSnapshots() {
        when(quotations.requests()).thenReturn(List.of());
        when(quotations.quotations()).thenReturn(List.of());
        when(orders.orders()).thenReturn(List.of());
        when(invoices.invoices()).thenReturn(List.of());
    }

    @Test
    void filtersSearchesAndPaginatesAssembledDossiers() {
        Instant earlier = Instant.parse("2026-10-30T12:00:00Z");
        Instant later = Instant.parse("2026-10-31T12:00:00Z");
        when(quotations.quotations()).thenReturn(List.of(
                quotation(UUID.randomUUID(), "SOU-001", "DRAFT", "Client A", earlier),
                quotation(UUID.randomUUID(), "SOU-002", "REFUSED", "Client B", later),
                quotation(UUID.randomUUID(), "SOU-003", "DRAFT", "Client C", later)));

        var page = service.list(0, 1, "client", "ACTION_REQUIRED");

        assertEquals(2, page.totalElements());
        assertEquals(2, page.totalPages());
        assertEquals("Client C", page.content().getFirst().customerName());
        assertEquals(1, service.list(0, 10, "", "FINISHED").totalElements());
    }

    @Test
    void rejectsInvalidPagingSearchAndFilterValues() {
        assertThrows(IllegalArgumentException.class, () -> service.list(-1, 10, ""));
        assertThrows(IllegalArgumentException.class, () -> service.list(0, 10, "x".repeat(201)));
        assertThrows(IllegalArgumentException.class, () -> service.list(0, 10, "", "unknown"));
    }

    @Test
    void returnsNotFoundForMalformedAndUnknownDossierIds() {
        ResponseStatusException malformed = assertThrows(ResponseStatusException.class, () -> service.get("invalid"));
        ResponseStatusException unknown =
                assertThrows(ResponseStatusException.class, () -> service.get("REQUEST:" + UUID.randomUUID()));

        assertEquals(HttpStatus.NOT_FOUND, malformed.getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, unknown.getStatusCode());
    }

    private SalesQuotationWorkspaceApi.Quotation quotation(
            UUID id,
            String reference,
            String status,
            String customerName,
            Instant lastActivity) {
        return new SalesQuotationWorkspaceApi.Quotation(
                id,
                reference,
                status,
                customerName,
                null,
                null,
                null,
                1000,
                lastActivity,
                null,
                null);
    }
}
