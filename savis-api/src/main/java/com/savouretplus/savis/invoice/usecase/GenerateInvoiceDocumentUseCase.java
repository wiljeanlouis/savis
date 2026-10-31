package com.savouretplus.savis.invoice.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.invoice.domain.Invoice;
import com.savouretplus.savis.invoice.port.InvoiceDocumentRenderer;

import lombok.AllArgsConstructor;

/** Generates final PDFs exclusively from persisted invoice snapshots. */
@Service
@AllArgsConstructor
public class GenerateInvoiceDocumentUseCase {
    private final InvoiceService invoices;
    private final InvoiceDocumentRenderer renderer;

    /** Generates a PDF for an issued invoice, including an issued invoice later cancelled. */
    @Transactional(readOnly = true)
    public GeneratedInvoiceDocument generate(UUID invoiceId) {
        Invoice invoice = invoices.get(invoiceId);
        if (!invoice.isDocumentable()) {
            throw new IllegalStateException("La facture doit être émise avant de produire son PDF final");
        }
        return new GeneratedInvoiceDocument(
                "facture-%s.pdf".formatted(invoice.invoiceNumber()), renderer.render(invoice));
    }
}
