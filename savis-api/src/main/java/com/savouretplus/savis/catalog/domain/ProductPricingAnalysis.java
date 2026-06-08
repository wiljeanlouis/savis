package com.savouretplus.savis.catalog.domain;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.common.Money;

public record ProductPricingAnalysis(
        String analysisType,
        int analyzedQuantity,
        Money salePrice,
        Money unitCost,
        Money cost,
        BigDecimal actualMarginRate,
        BigDecimal targetMarginRate,
        Money recommendedPrice,
        PriceHealthStatus status,
        boolean complete,
        List<UUID> missingBomIds) {

    public ProductPricingAnalysis {
        if (analyzedQuantity <= 0) {
            throw new IllegalArgumentException("La quantité analysée doit être supérieure à zéro");
        }
        missingBomIds = missingBomIds != null ? List.copyOf(missingBomIds) : List.of();
    }
}
