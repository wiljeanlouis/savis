package com.savouretplus.savis.invoice.port;

/** Generates durable invoice business numbers. */
public interface InvoiceNumberGenerator {
    /** Returns the next unique number. */
    String next();
}
