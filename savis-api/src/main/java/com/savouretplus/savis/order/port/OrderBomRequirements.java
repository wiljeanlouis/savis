package com.savouretplus.savis.order.port;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.common.Unit;

/**
 * Defines the BOM explosion operation required by order reports.
 */
public interface OrderBomRequirements {

    /**
     * Explodes a BOM for the requested output quantity.
     */
    BomRequirements getRequirements(UUID bomId, BigDecimal outputQuantity);

    /**
     * Represents one exploded BOM.
     */
    record BomRequirements(UUID bomId, String bomName, List<ComponentRequirement> components) {

        /**
         * Normalizes component requirements.
         */
        public BomRequirements {
            components = components != null ? List.copyOf(components) : List.of();
        }
    }

    /**
     * Represents one scaled BOM component requirement.
     */
    record ComponentRequirement(
            String componentName,
            BigDecimal quantity,
            Unit unit,
            UUID selectedOfferId) {
    }
}
