package com.savouretplus.savis.catalog.adapter.bom;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.bom.api.BomPricingApi;
import com.savouretplus.savis.catalog.port.BomPricingPort;

import lombok.AllArgsConstructor;

@Component
@AllArgsConstructor
public class BomPricingAdapter implements BomPricingPort {

    private final BomPricingApi bomPricingApi;

    @Override
    public boolean exists(UUID bomId) {
        return bomPricingApi.existsBom(bomId);
    }

    @Override
    public BomPricing getPricing(UUID bomId) {
        BomPricingApi.BomPricing pricing = bomPricingApi.getBomPricing(bomId);
        return new BomPricing(
                pricing.totalCost(),
                pricing.yieldQuantity());
    }
}
