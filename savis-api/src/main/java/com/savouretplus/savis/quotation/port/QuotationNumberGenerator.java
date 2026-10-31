package com.savouretplus.savis.quotation.port;

/** Generates durable quotation numbers. */
public interface QuotationNumberGenerator {
    /** Returns the next unique, human-readable quotation number. */
    String next();
}
