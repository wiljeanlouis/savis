package com.savouretplus.savis.sales.invoice.adapter.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.sales.invoice.domain.Invoice;
import com.savouretplus.savis.sales.invoice.domain.InvoiceAddress;
import com.savouretplus.savis.sales.invoice.domain.InvoiceItem;
import com.savouretplus.savis.sales.invoice.domain.InvoiceStatus;
import com.savouretplus.savis.sales.invoice.port.InvoiceRepository;

import jakarta.persistence.EntityManager;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class InvoiceRepositoryAdapterTest {
    @Autowired InvoiceRepository repository;
    @Autowired EntityManager entityManager;

    @Test
    void persistsSourceCustomerTaxesAndLineSnapshots() {
        Invoice saved = repository.save(invoice());

        Invoice reloaded = repository.findByPublicId(saved.publicId()).orElseThrow();

        assertEquals("ADM-00000001", reloaded.sourceOrderNumber());
        assertEquals("Montréal", reloaded.customerAddress().city());
        assertEquals(InvoiceStatus.DRAFT, reloaded.status());
        assertEquals(10, reloaded.gstCents());
        assertEquals(5, reloaded.qstCents());
        assertEquals("Vanille", reloaded.items().getFirst().choices().getFirst().name());
        assertEquals(2365, reloaded.totalCents());
    }

    @Test
    void enforcesUniqueInvoiceNumbers() {
        Invoice first = invoice().issue("FAC-00000001", Instant.parse("2026-10-13T13:00:00Z"));
        repository.save(first);
        entityManager.flush();

        Invoice duplicateNumber = invoice().issue("FAC-00000001", Instant.parse("2026-10-13T13:01:00Z"));
        assertThrows(DataIntegrityViolationException.class, () -> {
            repository.save(duplicateNumber);
            entityManager.flush();
        });
    }

    @Test
    void enforcesOneInvoicePerSourceOrder() {
        UUID sourceOrderId = UUID.randomUUID();
        repository.save(invoice(sourceOrderId));
        entityManager.flush();

        assertThrows(DataIntegrityViolationException.class, () -> {
            repository.save(invoice(sourceOrderId));
            entityManager.flush();
        });
    }

    private Invoice invoice() {
        return invoice(UUID.randomUUID());
    }

    private Invoice invoice(UUID sourceOrderId) {
        Instant now = Instant.parse("2026-10-13T12:00:00Z");
        InvoiceItem item = new InvoiceItem(
                null, UUID.randomUUID(), UUID.randomUUID(), "Service", "SINGLE_CHOICE", null,
                2, 1200, 1200, 2400, "unit", "Unité", 1, "SINGLE_CHOICE",
                List.of(new InvoiceItem.Choice("vanilla", "Vanille", "Style")), List.of(), List.of());
        return new Invoice(
                null, null, null, sourceOrderId, "ADM-00000001", InvoiceStatus.DRAFT,
                "Ada", "+15145550100", "ada@example.com",
                new InvoiceAddress("123 rue Principale", null, "Montréal", "QC", "H1H 1H1"),
                "Snapshot", 100, 50, 10, 5, 2365, now, now, null, null, List.of(item));
    }
}
