package com.savouretplus.savis.sales.quotation.usecase;

public class QuoteRequestNotFoundException extends RuntimeException {
    public QuoteRequestNotFoundException() { super("Demande introuvable"); }
}
