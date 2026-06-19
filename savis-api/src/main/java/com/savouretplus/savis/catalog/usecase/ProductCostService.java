package com.savouretplus.savis.catalog.usecase;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.savouretplus.savis.catalog.domain.AllocationType;
import com.savouretplus.savis.catalog.domain.ChoiceAllocation;
import com.savouretplus.savis.catalog.domain.IngredientSelection;
import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductBom;
import com.savouretplus.savis.catalog.domain.ProductConfiguration;
import com.savouretplus.savis.catalog.domain.ProductIngredientOption;
import com.savouretplus.savis.catalog.domain.ProductPurchaseMode;
import com.savouretplus.savis.catalog.domain.ProductType;
import com.savouretplus.savis.catalog.port.BomPricingPort;
import com.savouretplus.savis.common.Money;

import lombok.AllArgsConstructor;

/**
 * Calculates product costs from linked BOM pricing information.
 */
@Service
@AllArgsConstructor
public class ProductCostService {

    private final BomPricingPort bomPricingPort;

    /**
     * Calculates pricing information for the provided input.
     */
    public ProductCost calculate(Product product, ProductConfiguration configuration) {
        ProductConfiguration safeConfiguration = configuration != null
                ? configuration
                : ProductConfiguration.empty();
        product.validateConfiguration(safeConfiguration);

        CostAccumulator accumulator = new CostAccumulator(product.basePrice().currency());
        addProductBoms(product, accumulator);

        switch (product.productType()) {
            case STANDARD -> {
            }
            case SINGLE_CHOICE -> addSingleChoiceCost(product, safeConfiguration, accumulator);
            case SINGLE_CHOICE_BUNDLE -> addBundleCost(product, safeConfiguration, accumulator);
            case INGREDIENT_CUSTOMIZATION -> addIngredientCost(product, safeConfiguration, accumulator);
        }

        return accumulator.result();
    }

    /**
     * Calculates the worst-case pricing information for a product.
     */
    public ProductCost calculateWorstCase(Product product, String purchaseModeCode) {
        ProductPurchaseMode mode = product.requireActiveMode(purchaseModeCode);
        if (product.productType() != ProductType.SINGLE_CHOICE_BUNDLE
                || mode.allocationType() != AllocationType.CHOICE_ALLOCATION) {
            throw new IllegalArgumentException("Le pire cas s'applique uniquement aux bundles composables");
        }

        CostAccumulator accumulator = new CostAccumulator(product.basePrice().currency());
        addProductBoms(product, accumulator);
        List<ProductCost> optionCosts = product.choiceGroup().options().stream()
                .filter(option -> option.active())
                .map(option -> costForBom(option.bomId(), product.basePrice().currency()))
                .toList();

        if (optionCosts.isEmpty()) {
            accumulator.markIncomplete();
            return accumulator.result();
        }
        optionCosts.stream()
                .filter(cost -> !cost.complete())
                .forEach(accumulator::addIncomplete);
        if (optionCosts.stream().anyMatch(cost -> !cost.complete())) {
            return accumulator.result();
        }

        Money maximumUnitCost = optionCosts.stream()
                .map(ProductCost::cost)
                .max((left, right) -> left.amount().compareTo(right.amount()))
                .orElse(Money.ZERO);
        accumulator.addCost(maximumUnitCost.multiply(mode.quantity()));
        return accumulator.result();
    }

    private void addProductBoms(Product product, CostAccumulator accumulator) {
        for (ProductBom productBom : product.productBoms()) {
            accumulator.addBom(productBom.bomId(), productBom.quantity());
        }
    }

    private void addSingleChoiceCost(
            Product product,
            ProductConfiguration configuration,
            CostAccumulator accumulator) {
        if (configuration.choiceCode() == null) {
            return;
        }
        ProductPurchaseMode mode = configuration.purchaseModeCode() != null
                ? product.requireActiveMode(configuration.purchaseModeCode())
                : null;
        int quantity = mode != null ? mode.quantity() : 1;
        accumulator.addBom(
                product.requireActiveChoice(configuration.choiceCode()).bomId(),
                BigDecimal.valueOf(quantity));
    }

    private void addBundleCost(
            Product product,
            ProductConfiguration configuration,
            CostAccumulator accumulator) {
        ProductPurchaseMode mode = product.requireActiveMode(configuration.purchaseModeCode());
        if (mode.allocationType() == AllocationType.CHOICE_ALLOCATION) {
            for (ChoiceAllocation allocation : configuration.allocations()) {
                accumulator.addBom(
                        product.requireActiveChoice(allocation.choiceCode()).bomId(),
                        BigDecimal.valueOf(allocation.quantity()));
            }
            return;
        }
        accumulator.addBom(
                product.requireActiveChoice(configuration.choiceCode()).bomId(),
                BigDecimal.valueOf(mode.quantity()));
    }

    private void addIngredientCost(
            Product product,
            ProductConfiguration configuration,
            CostAccumulator accumulator) {
        for (ProductIngredientOption ingredient : product.ingredientOptions().stream()
                .filter(ProductIngredientOption::active)
                .toList()) {
            int quantity = configuration.ingredients().stream()
                    .filter(selection -> selection.ingredientCode().equals(ingredient.code()))
                    .mapToInt(IngredientSelection::quantity)
                    .findFirst()
                    .orElse(ingredient.defaultQuantity());
            int extraQuantity = ingredient.extraQuantity(quantity);
            if (extraQuantity > 0) {
                accumulator.addBom(ingredient.bomId(), BigDecimal.valueOf(extraQuantity));
            } else {
                accumulator.checkBom(ingredient.bomId());
            }
        }
    }

    private ProductCost costForBom(UUID bomId, String currency) {
        CostAccumulator accumulator = new CostAccumulator(currency);
        accumulator.addBom(bomId, BigDecimal.ONE);
        return accumulator.result();
    }

    /**
     * Represents a calculated product cost and whether every required BOM price was available.
     */
    public record ProductCost(Money cost, boolean complete, List<UUID> missingBomIds) {
        /**
         * Normalizes missing BOM identifiers for a product cost result.
         */
        public ProductCost {
            missingBomIds = List.copyOf(missingBomIds);
        }
    }

    /**
     * Provides cost accumulator behavior.
     */
    private final class CostAccumulator {
        private Money total;
        private final List<UUID> missingBomIds = new ArrayList<>();

        private CostAccumulator(String currency) {
            total = new Money(BigDecimal.ZERO, currency);
        }

        private void addBom(UUID bomId, BigDecimal quantity) {
            if (bomId == null) {
                complete = false;
                return;
            }
            if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
                return;
            }
            try {
                BomPricingPort.BomPricing pricing = pricingFor(bomId);
                Money unitCost = new Money(
                        pricing.totalCost().amount()
                                .divide(pricing.yieldQuantity(), 10, RoundingMode.HALF_UP),
                        pricing.totalCost().currency());
                total = total.add(unitCost.multiply(quantity));
            } catch (RuntimeException exception) {
                missingBomIds.add(bomId);
            }
        }

        private void checkBom(UUID bomId) {
            if (bomId == null) {
                complete = false;
                return;
            }
            try {
                pricingFor(bomId);
            } catch (RuntimeException exception) {
                missingBomIds.add(bomId);
            }
        }

        private BomPricingPort.BomPricing pricingFor(UUID bomId) {
            BomPricingPort.BomPricing pricing = bomPricingPort.getPricing(bomId);
            if (pricing == null
                    || pricing.totalCost() == null
                    || pricing.yieldQuantity() == null
                    || pricing.yieldQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("Coût BOM indisponible");
            }
            return pricing;
        }

        private void addCost(Money cost) {
            total = total.add(cost);
        }

        private void addIncomplete(ProductCost cost) {
            complete = false;
            missingBomIds.addAll(cost.missingBomIds());
        }

        private void markIncomplete() {
            complete = false;
        }

        private ProductCost result() {
            return new ProductCost(
                    new Money(total.amount().stripTrailingZeros(), total.currency()),
                    complete && missingBomIds.isEmpty(),
                    missingBomIds.stream().distinct().toList());
        }

        private boolean complete = true;
    }
}
