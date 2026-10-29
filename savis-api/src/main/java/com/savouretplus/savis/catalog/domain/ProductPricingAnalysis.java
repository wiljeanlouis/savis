package com.savouretplus.savis.catalog.domain;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import com.savouretplus.savis.common.Money;

/**
 * Represents the cost, price, and margin analysis for a catalog product.
 */
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
        List<UUID> missingBomIds,
        Money knownSubtotal,
        List<CostDiagnostic> diagnostics) {

    /**
     * Validates and normalizes a product pricing analysis result.
     */
    public ProductPricingAnalysis {
        if (analyzedQuantity <= 0) {
            throw new IllegalArgumentException("La quantité analysée doit être supérieure à zéro");
        }
        Objects.requireNonNull(knownSubtotal);
        diagnostics = List.copyOf(diagnostics);
        if (complete && (cost == null || unitCost == null || actualMarginRate == null || recommendedPrice == null
                || diagnostics.stream().anyMatch(CostDiagnostic::blocking))) {
            throw new IllegalArgumentException("Une analyse complète exige un coût, une marge et une recommandation");
        }
        if (!complete && (cost != null || unitCost != null || actualMarginRate != null || recommendedPrice != null)) {
            throw new IllegalArgumentException("Un coût incomplet ne permet ni total, ni marge, ni recommandation");
        }
        missingBomIds = missingBomIds != null ? List.copyOf(missingBomIds) : List.of();
    }
}
