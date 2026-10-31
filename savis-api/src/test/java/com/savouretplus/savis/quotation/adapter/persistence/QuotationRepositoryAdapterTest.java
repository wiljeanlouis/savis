package com.savouretplus.savis.quotation.adapter.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.quotation.domain.Quotation;
import com.savouretplus.savis.quotation.domain.QuotationAddress;
import com.savouretplus.savis.quotation.domain.QuotationItem;
import com.savouretplus.savis.quotation.domain.QuotationStatus;
import com.savouretplus.savis.quotation.port.QuotationRepository;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class QuotationRepositoryAdapterTest {
    @Autowired QuotationRepository repository;

    @Test
    void persistsCommercialTermsAndConfiguredProductSnapshots() {
        Quotation saved = repository.save(quotation());

        Quotation reloaded = repository.findByPublicId(saved.publicId()).orElseThrow();

        assertEquals("SOU-00000012", reloaded.quotationNumber());
        assertEquals(LocalDate.of(2026, 11, 30), reloaded.validUntil());
        assertEquals("Montréal", reloaded.customerAddress().city());
        assertEquals(QuotationStatus.DRAFT, reloaded.status());
        assertEquals("SERVICE", reloaded.items().getFirst().commercialType());
        assertEquals("SINGLE_CHOICE", reloaded.items().getFirst().productType());
        assertEquals("Vanille", reloaded.items().getFirst().choices().getFirst().name());
        assertEquals(1200, reloaded.items().getFirst().unitPriceCents());
        assertEquals(2450, reloaded.totalCents());
    }

    private Quotation quotation() {
        Instant now = Instant.parse("2026-10-12T15:00:00Z");
        QuotationItem item = new QuotationItem(
                null, UUID.randomUUID(), "Installation personnalisée", "SERVICE", "SINGLE_CHOICE",
                "/installation.jpg", 2, 1200, 1200, 2400,
                "service", "Service", 1, "SINGLE_CHOICE",
                List.of(new QuotationItem.Choice("vanilla", "Vanille", "Style")),
                List.of(), List.of());
        return new Quotation(
                null, null, "SOU-00000012", QuotationStatus.DRAFT,
                "Ada", "+15145550100", "ada@example.com",
                new QuotationAddress("123 rue Principale", null, "Montréal", "QC", "H1H 1H1"),
                LocalDate.of(2026, 11, 30), "Offre", 100, 150, 2450,
                now, now, null, null, null, null, List.of(item));
    }
}
