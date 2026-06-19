package com.savouretplus.savis.bom.domain;

import java.util.UUID;

import com.savouretplus.savis.common.Quantity;

/**
 * Represents a material component required by a BOM.
 */
public record BomComponent(
        Long id,
        String componentName,
        Quantity quantity,
        UUID selectedOfferId) {

    /**
     * Returns the component display name.
     */
    public String componentName() {
        return componentName.toLowerCase();
    }

}
