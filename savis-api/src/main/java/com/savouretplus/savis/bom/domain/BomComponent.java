package com.savouretplus.savis.bom.domain;

import java.util.UUID;

import com.savouretplus.savis.common.Quantity;

/**
 * Represents a material component required by a BOM.
 */
public record BomComponent(
        Long id,
        UUID resourceId,
        String componentName,
        Quantity quantity,
        UUID selectedOfferId) {

    /** Compatibility constructor for domain-only pricing fixtures; persisted components require resourceId. */
    public BomComponent(Long id, String componentName, Quantity quantity, UUID selectedOfferId) {
        this(id, null, componentName, quantity, selectedOfferId);
    }

    /**
     * Returns the component display name.
     */
    public String componentName() {
        return componentName.toLowerCase();
    }

    /** Preserves the display snapshot while pricing and legacy events keep their lowercase key. */
    public String resourceName() { return componentName; }

}
