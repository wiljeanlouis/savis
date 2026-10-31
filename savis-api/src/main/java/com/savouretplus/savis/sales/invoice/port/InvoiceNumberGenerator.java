package com.savouretplus.savis.sales.invoice.port;

/** Generates durable invoice business numbers. */
public interface InvoiceNumberGenerator {
    /** Returns the next unique number. */
    String next();
}
