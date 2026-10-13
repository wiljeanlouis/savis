package com.savouretplus.savis.order.api;

import java.util.UUID;

/** Raised when an invoice references an unknown source order. */
public class InvoiceSourceOrderNotFoundException extends RuntimeException {
    public InvoiceSourceOrderNotFoundException(UUID orderId) {
        super("Commande introuvable: " + orderId);
    }
}
