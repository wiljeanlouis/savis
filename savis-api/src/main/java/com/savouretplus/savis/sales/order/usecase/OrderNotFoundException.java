package com.savouretplus.savis.sales.order.usecase;

import java.util.UUID;

/**
 * Raised when an order public identifier is unknown.
 */
public class OrderNotFoundException extends RuntimeException {

    /**
     * Creates an exception for the missing public order identifier.
     */
    public OrderNotFoundException(UUID orderId) {
        super("Commande introuvable: " + orderId);
    }
}
