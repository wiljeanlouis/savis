package com.savouretplus.savis.sales.invoice.usecase;

import java.util.UUID;

/** Raised when an invoice public identifier does not exist. */
public class InvoiceNotFoundException extends RuntimeException {
    public InvoiceNotFoundException(UUID invoiceId) {
        super("Facture introuvable: " + invoiceId);
    }
}
