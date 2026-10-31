package com.savouretplus.savis.sales.quotation.port;

/** Generates durable quotation numbers. */
public interface QuotationNumberGenerator {
    /** Returns the next unique, human-readable quotation number. */
    String next();
}
