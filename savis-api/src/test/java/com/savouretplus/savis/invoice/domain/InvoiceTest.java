package com.savouretplus.savis.invoice.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class InvoiceTest {
    private static final Instant CREATED = Instant.parse("2026-10-13T12:00:00Z");

    @Test
    void issuesDraftOnceAndMakesFinancialContentImmutable() {
        Invoice issued = draft().issue("FAC-00000001", CREATED.plusSeconds(60));

        assertEquals(InvoiceStatus.ISSUED, issued.status());
        assertEquals("FAC-00000001", issued.invoiceNumber());
        assertNotNull(issued.issuedAt());
        assertThrows(IllegalStateException.class, () -> issued.updateDraft(
                "Ada", "+15145550100", null, null, null, 0, 0, 0, 0, CREATED));
        assertThrows(IllegalStateException.class, () -> issued.issue("FAC-00000002", CREATED));
    }

    @Test
    void allowsCancellationFromDraftOrIssuedWithoutReopening() {
        Invoice cancelledDraft = draft().cancel(CREATED.plusSeconds(60));
        Invoice cancelledIssued = draft().issue("FAC-00000001", CREATED.plusSeconds(30))
                .cancel(CREATED.plusSeconds(60));

        assertEquals(InvoiceStatus.CANCELLED, cancelledDraft.status());
        assertNull(cancelledDraft.invoiceNumber());
        assertEquals("FAC-00000001", cancelledIssued.invoiceNumber());
        assertThrows(IllegalStateException.class, () -> cancelledIssued.issue("FAC-00000002", CREATED));
    }

    @Test
    void rejectsIncoherentTotalsAndArithmeticOverflow() {
        InvoiceItem item = item(2, 1200);
        assertThrows(IllegalArgumentException.class, () -> new Invoice(
                null, null, null, UUID.randomUUID(), "ADM-00000001", InvoiceStatus.DRAFT,
                "Ada", "+15145550100", null, null, null,
                100, 50, 10, 5, 9999, CREATED, CREATED, null, null, List.of(item)));
        assertThrows(IllegalArgumentException.class, () -> new InvoiceItem(
                null, UUID.randomUUID(), UUID.randomUUID(), "Service", "STANDARD", null,
                Integer.MAX_VALUE, 2, 2, 0, "unit", "Unité", 1, "NONE",
                List.of(), List.of(), List.of()));
    }

    private Invoice draft() {
        return new Invoice(
                null, null, null, UUID.randomUUID(), "ADM-00000001", InvoiceStatus.DRAFT,
                "Ada", "+15145550100", "ada@example.com", null, "Snapshot",
                100, 50, 10, 5, 2365, CREATED, CREATED, null, null, List.of(item(2, 1200)));
    }

    private InvoiceItem item(int quantity, int unitPrice) {
        return new InvoiceItem(
                null, UUID.randomUUID(), UUID.randomUUID(), "Service", "STANDARD", null,
                quantity, unitPrice, unitPrice, Math.multiplyExact(quantity, unitPrice),
                "unit", "Unité", 1, "NONE", List.of(), List.of(), List.of());
    }
}
