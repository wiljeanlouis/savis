package com.savouretplus.savis.bom.usecase;

import java.math.BigDecimal;
import com.savouretplus.savis.bom.api.BomPricingApi;
import com.savouretplus.savis.bom.domain.BomCost;

/** Translates internal cost lines into the BOM public contract. */
public final class BomPricingMapper {
    private BomPricingMapper() {}

    public static BomPricingApi.BomPricing from(BomCost cost) {
        return new BomPricingApi.BomPricing(cost.totalCost(), cost.yieldQuantity(), cost.knownSubtotal(),
                cost.componentSubtotal(), cost.activitySubtotal(), cost.complete(),
                cost.components().stream().map(BomPricingMapper::line).toList(),
                cost.activities().stream().map(BomPricingMapper::line).toList(),
                cost.diagnostics().stream().map(BomPricingMapper::diagnostic).toList());
    }

    private static BomPricingApi.CostLine line(BomCost.Line line) {
        var source = line.source();
        var size = source == null ? null : source.packageSize();
        return new BomPricingApi.CostLine(line.label(), line.status().name(), line.amount(), line.quantity(),
                line.unit(), line.hourlyRate(), source == null ? null : new BomPricingApi.PriceSource(
                        source.selectedOfferId(), source.usedOfferId(), source.observedAt(), source.packagePrice(),
                        size != null && Double.isFinite(size.value()) ? BigDecimal.valueOf(size.value()) : null,
                        size != null && size.unit() != null ? size.unit().getSymbole() : null),
                line.diagnostics().stream().map(BomPricingMapper::diagnostic).toList());
    }

    private static BomPricingApi.Diagnostic diagnostic(BomCost.Diagnostic diagnostic) {
        return new BomPricingApi.Diagnostic(diagnostic.code(), diagnostic.source(),
                diagnostic.message(), diagnostic.blocking());
    }
}
