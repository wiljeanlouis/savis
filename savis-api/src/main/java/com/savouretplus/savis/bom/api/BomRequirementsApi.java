package com.savouretplus.savis.bom.api;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.common.Unit;

/**
 * Exposes the material requirements produced by exploding a BOM.
 */
public interface BomRequirementsApi {

    /**
     * Returns the components required for the requested BOM output quantity.
     */
    BomRequirements getRequirements(UUID bomId, BigDecimal outputQuantity);

    /**
     * Represents an exploded BOM and its scaled component requirements.
     */
    record BomRequirements(
            UUID bomId,
            String bomName,
            List<ComponentRequirement> components) {

        /**
         * Normalizes the component collection.
         */
        public BomRequirements {
            components = components != null ? List.copyOf(components) : List.of();
        }
    }

    /**
     * Represents one component quantity required by an exploded BOM.
     */
    record ComponentRequirement(
            String componentName,
            BigDecimal quantity,
            Unit unit,
            UUID selectedOfferId) {
    }
}
