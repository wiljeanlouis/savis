package com.savouretplus.savis.catalog.port;

import java.math.BigDecimal;
import java.util.UUID;

import com.savouretplus.savis.common.Money;

public interface BomPricingPort {

    boolean exists(UUID bomId);

    BomPricing getPricing(UUID bomId);

    record BomPricing(Money totalCost, BigDecimal yieldQuantity) {
    }
}
