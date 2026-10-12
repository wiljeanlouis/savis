package com.savouretplus.savis.order.port;

import java.time.Instant;

import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.usecase.OrderDocumentType;

/**
 * Renders a customer-facing document from an immutable order snapshot.
 */
public interface OrderDocumentRenderer {

    /**
     * Renders the requested document as PDF bytes.
     */
    byte[] render(Order order, OrderDocumentType type, Instant generatedAt);
}
