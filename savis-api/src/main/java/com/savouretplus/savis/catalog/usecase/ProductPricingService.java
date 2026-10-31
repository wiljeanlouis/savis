package com.savouretplus.savis.catalog.usecase;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.savouretplus.savis.catalog.domain.PriceHealthStatus;
import com.savouretplus.savis.catalog.domain.CostDiagnostic;
import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductConfiguration;
import com.savouretplus.savis.catalog.domain.ProductPricingAnalysis;
import com.savouretplus.savis.catalog.usecase.ProductCostService.ProductCost;
import com.savouretplus.savis.common.Money;

import lombok.AllArgsConstructor;

/**
 * Analyzes product pricing, margin, and price health for selected configurations.
 */
@Service
@AllArgsConstructor
public class ProductPricingService {

    private static final BigDecimal QUARTER = new BigDecimal("0.25");

    private final ProductCostService costService;

    /**
     * Analyzes the price and margin for the requested product configuration.
     */
    public ProductPricingAnalysis analyze(Product product, ProductConfiguration configuration) {
        Money salePrice = product.calculateSalePrice(configuration);
        return analyze(
                product,
                "CONFIGURATION",
                analyzedQuantity(product, configuration),
                salePrice,
                costService.calculate(product, configuration));
    }

    /**
     * Analyzes product pricing using the most expensive valid configuration.
     */
    public ProductPricingAnalysis analyzeWorstCase(Product product, String purchaseModeCode) {
        var mode = product.requireActiveMode(purchaseModeCode);
        return analyze(
                product,
                "WORST_CASE",
                mode.quantity(),
                mode.price(),
                costService.calculateWorstCase(product, purchaseModeCode));
    }

    private ProductPricingAnalysis analyze(
            Product product,
            String analysisType,
            int analyzedQuantity,
            Money salePrice,
            ProductCost cost) {
        if (!cost.complete() || salePrice.amount().signum() <= 0) {
            List<CostDiagnostic> diagnostics = new ArrayList<>(cost.diagnostics());
            if (salePrice.amount().signum() <= 0) {
                diagnostics.add(new CostDiagnostic(null, "SALE_PRICE_NON_POSITIVE", "Prix de vente",
                        "Le prix de vente doit être supérieur à zéro pour analyser la marge", true));
            }
            return new ProductPricingAnalysis(
                    analysisType,
                    analyzedQuantity,
                    salePrice,
                    null,
                    null,
                    null,
                    product.targetMarginRate(),
                    null,
                    PriceHealthStatus.INCOMPLETE,
                    false,
                    cost.missingBomIds(), cost.knownSubtotal(), diagnostics);
        }

        Money unitCost = new Money(
                cost.knownSubtotal().amount().divide(BigDecimal.valueOf(analyzedQuantity), 10, RoundingMode.HALF_UP),
                cost.knownSubtotal().currency());

        BigDecimal actualMargin = salePrice.amount()
                .subtract(cost.knownSubtotal().amount())
                .divide(salePrice.amount(), 6, RoundingMode.HALF_UP);
        PriceHealthStatus status = cost.knownSubtotal().amount().compareTo(salePrice.amount()) > 0
                ? PriceHealthStatus.LOSS
                : actualMargin.compareTo(product.targetMarginRate()) >= 0
                        ? PriceHealthStatus.GOOD
                        : PriceHealthStatus.REVIEW;
        BigDecimal rawRecommendation = cost.knownSubtotal().amount()
                .divide(BigDecimal.ONE.subtract(product.targetMarginRate()), 10, RoundingMode.UP);
        BigDecimal roundedRecommendation = rawRecommendation
                .divide(QUARTER, 0, RoundingMode.CEILING)
                .multiply(QUARTER)
                .setScale(2, RoundingMode.UNNECESSARY);

        return new ProductPricingAnalysis(
                analysisType,
                analyzedQuantity,
                salePrice,
                unitCost,
                cost.knownSubtotal(),
                actualMargin,
                product.targetMarginRate(),
                new Money(roundedRecommendation, salePrice.currency()),
                status,
                true,
                List.of(), cost.knownSubtotal(), cost.diagnostics());
    }

    private int analyzedQuantity(Product product, ProductConfiguration configuration) {
        return product.selectedMode(configuration).quantity();
    }
}
