package com.savouretplus.savis.invoice.usecase;

/** Represents a generated invoice PDF download. */
public record GeneratedInvoiceDocument(String fileName, byte[] content) {
}
