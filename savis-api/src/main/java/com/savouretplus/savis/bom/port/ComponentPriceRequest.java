package com.savouretplus.savis.bom.port;

import java.util.UUID;

import com.savouretplus.savis.common.Quantity;

/**
 * Represents a pricing request for one BOM component quantity.
 */
public record ComponentPriceRequest(
        String componentName,
        Quantity quantity,
        UUID selectedOfferId) {

    /**
     * Validates a component price request.
     */
    public ComponentPriceRequest {
        componentName = componentName.toLowerCase();
    }
}
