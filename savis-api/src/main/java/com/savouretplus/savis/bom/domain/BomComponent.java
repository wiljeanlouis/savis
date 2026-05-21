package com.savouretplus.savis.bom.domain;

import java.util.UUID;

import com.savouretplus.savis.common.Quantity;

public record BomComponent(
        Long id,
        String componentName,
        Quantity quantity,
        UUID selectedOfferId) {

    public String componentName() {
        return componentName.toLowerCase();
    }

}
