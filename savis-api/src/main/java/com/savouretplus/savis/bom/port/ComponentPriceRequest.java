package com.savouretplus.savis.bom.port;

import java.util.UUID;

import com.savouretplus.savis.common.Quantity;

public record ComponentPriceRequest(
        String componentName,
        Quantity quantity,
        UUID selectedOfferId) {

    public ComponentPriceRequest {
        componentName = componentName.toLowerCase();
    }
}
