package com.savouretplus.savis.quotation.usecase;

import java.util.UUID;

/** Raised when a quotation identifier cannot be resolved. */
public class QuotationNotFoundException extends RuntimeException {
    /** Creates an error for the unresolved public identifier. */
    public QuotationNotFoundException(UUID id) {
        super("Soumission introuvable: " + id);
    }
}
