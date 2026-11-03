package com.savouretplus.savis.sales.invoice.usecase;

/** Represents a generated invoice PDF download. */
public record GeneratedInvoiceDocument(String fileName, byte[] content) {
}
