package com.savouretplus.savis.catalog.adapter.bom;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.bom.api.BomPricingApi;
import com.savouretplus.savis.catalog.port.BomPricingPort;

import lombok.AllArgsConstructor;

/**
 * Adapts the BOM pricing API to the catalog module pricing port.
 */
@Component
@AllArgsConstructor
public class BomPricingAdapter implements BomPricingPort {

    private final BomPricingApi bomPricingApi;

    /**
     * Checks whether pricing exists for a BOM.
     */
    @Override
    public boolean exists(UUID bomId) {
        return bomPricingApi.existsBom(bomId);
    }

    /**
     * Returns the pricing.
     */
    @Override
    public BomPricing getPricing(UUID bomId) {
        BomPricingApi.BomPricing pricing = bomPricingApi.getBomPricing(bomId);
        return new BomPricing(
                pricing.totalCost(),
                pricing.yieldQuantity());
    }
}
