package com.savouretplus.savis.catalog.usecase;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Service;

import com.savouretplus.savis.catalog.domain.PriceHealthStatus;
import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductConfiguration;
import com.savouretplus.savis.catalog.domain.ProductPricingAnalysis;
import com.savouretplus.savis.catalog.usecase.ProductCostService.ProductCost;
import com.savouretplus.savis.common.Money;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ProductPricingService {

    private static final BigDecimal QUARTER = new BigDecimal("0.25");

    private final ProductCostService costService;

    public ProductPricingAnalysis analyze(Product product, ProductConfiguration configuration) {
        Money salePrice = product.calculateSalePrice(configuration);
        return analyze(
                product,
                "CONFIGURATION",
                analyzedQuantity(product, configuration),
                salePrice,
                costService.calculate(product, configuration));
    }

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
        Money unitCost = new Money(
                cost.cost().amount().divide(BigDecimal.valueOf(analyzedQuantity), 10, RoundingMode.HALF_UP),
                cost.cost().currency());
        if (!cost.complete() || salePrice.amount().compareTo(BigDecimal.ZERO) <= 0) {
            return new ProductPricingAnalysis(
                    analysisType,
                    analyzedQuantity,
                    salePrice,
                    unitCost,
                    cost.cost(),
                    null,
                    product.targetMarginRate(),
                    null,
                    PriceHealthStatus.INCOMPLETE,
                    false,
                    cost.missingBomIds());
        }

        BigDecimal actualMargin = salePrice.amount()
                .subtract(cost.cost().amount())
                .divide(salePrice.amount(), 6, RoundingMode.HALF_UP);
        PriceHealthStatus status = cost.cost().amount().compareTo(salePrice.amount()) > 0
                ? PriceHealthStatus.LOSS
                : actualMargin.compareTo(product.targetMarginRate()) >= 0
                        ? PriceHealthStatus.GOOD
                        : PriceHealthStatus.REVIEW;
        BigDecimal rawRecommendation = cost.cost().amount()
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
                cost.cost(),
                actualMargin,
                product.targetMarginRate(),
                new Money(roundedRecommendation, salePrice.currency()),
                status,
                true,
                List.of());
    }

    private int analyzedQuantity(Product product, ProductConfiguration configuration) {
        if (configuration == null
                || configuration.purchaseModeCode() == null
                || configuration.purchaseModeCode().isBlank()) {
            return 1;
        }
        return product.requireActiveMode(configuration.purchaseModeCode()).quantity();
    }
}
