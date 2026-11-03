package com.savouretplus.savis.sales.quotation.domain;

/** Expected business failure whose controlled message may be shown to the operator. */
public class QuoteRequestValidationException extends IllegalArgumentException {
    public QuoteRequestValidationException(String message) { super(message); }
}
