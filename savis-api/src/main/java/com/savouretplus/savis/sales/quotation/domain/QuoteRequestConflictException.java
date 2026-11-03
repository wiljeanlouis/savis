package com.savouretplus.savis.sales.quotation.domain;

/** Expected business failure whose controlled message may be shown to the operator. */
public class QuoteRequestConflictException extends IllegalStateException {
    public QuoteRequestConflictException(String message) { super(message); }
}
