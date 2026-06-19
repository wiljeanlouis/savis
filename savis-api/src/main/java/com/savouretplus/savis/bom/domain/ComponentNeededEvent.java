package com.savouretplus.savis.bom.domain;

import org.springframework.modulith.events.Externalized;

/**
 * Domain event emitted when pricing data is needed for a BOM component.
 */
@Externalized("#{@offerRequestExchange.name}::#{@offerRequest.name}")
public record ComponentNeededEvent(String componentNameKey, BomType type) {

    /**
     * Creates a new value object from the provided input.
     */
    public static ComponentNeededEvent of(String componentNameKey, BomType type) {
        /**
         * Creates a component needed event instance.
         */
        return new ComponentNeededEvent(componentNameKey, type != null ? type : BomType.FOOD);
    }

}
