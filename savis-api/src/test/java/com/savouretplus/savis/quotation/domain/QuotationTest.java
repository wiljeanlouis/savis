package com.savouretplus.savis.quotation.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class QuotationTest {
    private static final Instant NOW = Instant.parse("2026-10-12T15:00:00Z");

    @Test
    void followsTheExplicitCommercialLifecycleAndCapturesDates() {
        Quotation draft = quotation();

        Quotation sent = draft.changeStatus(QuotationStatus.SENT, NOW.plusSeconds(60));
        Quotation accepted = sent.changeStatus(QuotationStatus.ACCEPTED, NOW.plusSeconds(120));

        assertEquals(QuotationStatus.ACCEPTED, accepted.status());
        assertEquals(NOW.plusSeconds(60), accepted.sentAt());
        assertEquals(NOW.plusSeconds(120), accepted.acceptedAt());
        assertThrows(IllegalStateException.class,
                () -> accepted.changeStatus(QuotationStatus.REJECTED, NOW.plusSeconds(180)));
    }

    @Test
    void rejectsSkippingTheSentState() {
        assertThrows(IllegalStateException.class,
                () -> quotation().changeStatus(QuotationStatus.ACCEPTED, NOW.plusSeconds(60)));
    }

    private Quotation quotation() {
        QuotationItem item = new QuotationItem(
                null, UUID.randomUUID(), "Installation", "SERVICE", "STANDARD", null,
                1, 15000, 15000, 15000, "service", "Service", 1, "NONE",
                List.of(), List.of(), List.of());
        return new Quotation(
                1L, UUID.randomUUID(), "SOU-00000001", QuotationStatus.DRAFT,
                "Ada", "+15145550100", "ada@example.com", null,
                LocalDate.of(2026, 11, 12), null, 0, 0, 15000,
                NOW, NOW, null, null, null, null, List.of(item));
    }
}
