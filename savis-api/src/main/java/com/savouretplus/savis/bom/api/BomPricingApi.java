package com.savouretplus.savis.bom.api;

import java.math.BigDecimal;
import java.util.UUID;

import com.savouretplus.savis.common.Money;

public interface BomPricingApi {

    boolean existsBom(UUID bomId);

    BomPricing getBomPricing(UUID bomId);

    record BomPricing(Money totalCost, BigDecimal yieldQuantity) {
    }
}
