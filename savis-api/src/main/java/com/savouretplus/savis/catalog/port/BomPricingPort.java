package com.savouretplus.savis.catalog.port;

import java.math.BigDecimal;
import java.util.UUID;

import com.savouretplus.savis.common.Money;

/**
 * Defines the catalog module port used to read BOM pricing information.
 */
public interface BomPricingPort {

    /**
     * Checks whether pricing exists for a BOM.
     */
    boolean exists(UUID bomId);

    /**
     * Returns the pricing.
     */
    BomPricing getPricing(UUID bomId);

    /**
     * Creates a BOM pricing result.
     */
    /**
     * Represents calculated BOM cost and yield information.
     */
    record BomPricing(Money totalCost, BigDecimal yieldQuantity) {
    }
}
