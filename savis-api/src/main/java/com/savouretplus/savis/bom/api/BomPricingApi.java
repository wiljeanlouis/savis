package com.savouretplus.savis.bom.api;

import java.math.BigDecimal;
import java.util.UUID;

import com.savouretplus.savis.common.Money;

/**
 * Exposes BOM pricing information to other application modules.
 */
public interface BomPricingApi {

    /**
     * Checks whether a BOM exists.
     */
    boolean existsBom(UUID bomId);

    /**
     * Returns the calculated pricing for a BOM.
     */
    BomPricing getBomPricing(UUID bomId);

    /**
     * Creates a BOM pricing result.
     */
    /**
     * Represents calculated BOM cost and yield information.
     */
    record BomPricing(Money totalCost, BigDecimal yieldQuantity) {
    }
}
