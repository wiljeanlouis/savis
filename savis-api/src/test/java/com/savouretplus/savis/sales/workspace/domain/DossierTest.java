package com.savouretplus.savis.sales.workspace.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class DossierTest {
    @Test
    void treatsPaidInvoiceAsFinishedAndUsesLatestActivityInTheTree() {
        UUID invoiceId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        Instant issuedAt = Instant.parse("2026-10-31T12:00:00Z");
        Instant paidAt = Instant.parse("2026-10-31T18:00:00Z");
        Node invoice = new Node(
                DocumentType.INVOICE,
                invoiceId,
                "FAC-001",
                "ISSUED",
                "PAID",
                paidAt,
                "Marie Tremblay",
                null,
                12000,
                issuedAt,
                orderId,
                "Consulter la facture",
                "/invoices/" + invoiceId);
        invoice.addChild(new Node(
                DocumentType.PAYMENT,
                invoiceId,
                "Paiement",
                "PAID",
                "PAID",
                paidAt,
                "Règlement",
                null,
                12000,
                paidAt,
                orderId,
                null,
                null));

        Dossier dossier = new Dossier(invoice);

        assertFalse(dossier.requiresAction());
        assertEquals("1 paiement confirmé", dossier.situation());
        assertEquals(paidAt, dossier.lastActivity());
        assertEquals(1, dossier.documentCount());
        assertTrue(dossier.matches("marie"));
    }

    @Test
    void identifiesDraftQuotationsAsActionableAndNormalizesTheirDescription() {
        Node quotation = new Node(
                DocumentType.QUOTATION,
                UUID.randomUUID(),
                "SOU-001",
                "DRAFT",
                "Client",
                "  Proposition à finaliser  ",
                12000,
                Instant.parse("2026-10-31T12:00:00Z"),
                null,
                "Reprendre le brouillon",
                "/quotations/draft");

        Dossier dossier = new Dossier(quotation);

        assertTrue(dossier.requiresAction());
        assertEquals("1 soumission en brouillon", dossier.situation());
        assertEquals("Proposition à finaliser", dossier.description());
    }
}
