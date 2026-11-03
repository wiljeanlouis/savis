package com.savouretplus.savis.sales.order.adapter.bom;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.bom.api.BomRequirementsApi;
import com.savouretplus.savis.sales.order.port.OrderBomRequirements;

import lombok.AllArgsConstructor;

/**
 * Adapts the public BOM explosion API to the order module port.
 */
@Component
@AllArgsConstructor
public class BomRequirementsAdapter implements OrderBomRequirements {
    private final BomRequirementsApi boms;

    /**
     * Returns the scaled components exposed by the BOM module.
     */
    @Override
    public BomRequirements getRequirements(UUID bomId, BigDecimal outputQuantity) {
        BomRequirementsApi.BomRequirements source = boms.getRequirements(bomId, outputQuantity);
        return new BomRequirements(
                source.bomId(),
                source.bomName(),
                source.components().stream()
                        .map(component -> new ComponentRequirement(
                                component.componentName(),
                                component.quantity(),
                                component.unit(),
                                component.selectedOfferId()))
                        .toList());
    }
}
