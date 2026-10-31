package com.savouretplus.savis.catalog.usecase;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.savouretplus.savis.catalog.domain.AllocationType;
import com.savouretplus.savis.catalog.domain.CostDiagnostic;
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

        String currency = product.selectedMode(safeConfiguration).price().currency();
        CostAccumulator accumulator = new CostAccumulator(currency);
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

        CostAccumulator accumulator = new CostAccumulator(mode.price().currency());
        addProductBoms(product, accumulator);
        List<ProductCost> optionCosts = product.choiceGroup().options().stream()
                .filter(option -> option.active())
                .map(option -> costForBom(option.bomId(), mode.price().currency()))
                .toList();

        if (optionCosts.isEmpty()) {
            accumulator.markIncomplete();
            return accumulator.result();
        }
        optionCosts.forEach(cost -> accumulator.diagnostics.addAll(cost.diagnostics()));
        optionCosts.stream().filter(cost -> !cost.complete()).forEach(accumulator::addIncomplete);
        if (optionCosts.stream().anyMatch(cost -> !cost.complete())) {
            accumulator.diagnostics.add(new CostDiagnostic(null, "WORST_CASE_UNDETERMINED", "Pire cas",
                    "Le pire cas est indéterminé; le sous-total connu couvre uniquement les compositions communes", true));
            return accumulator.result();
        }

        Money maximumUnitCost = optionCosts.stream()
                .map(ProductCost::knownSubtotal)
                .max((left, right) -> left.amount().compareTo(right.amount()))
                .orElseThrow(() -> new IllegalStateException("Aucune option valorisée pour le pire cas"));
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
    public record ProductCost(Money knownSubtotal, boolean complete, List<UUID> missingBomIds,
            List<CostDiagnostic> diagnostics) {
        /**
         * Normalizes missing BOM identifiers for a product cost result.
         */
        public ProductCost {
            missingBomIds = List.copyOf(missingBomIds);
            diagnostics = List.copyOf(diagnostics);
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

        private final List<CostDiagnostic> diagnostics = new ArrayList<>();

        private void addBom(UUID bomId, BigDecimal quantity) {
            if (quantity == null || quantity.signum() <= 0) {
                return;
            }
            BomPricingPort.BomPricing pricing = pricingFor(bomId);
            if (pricing == null || pricing.yieldQuantity() == null || pricing.yieldQuantity().signum() <= 0) {
                return; // No valid unit basis: do not add a batch amount to a product subtotal.
            }
            Money knownUnitCost = new Money(pricing.knownSubtotal().amount()
                    .divide(pricing.yieldQuantity(), 10, RoundingMode.HALF_UP), pricing.knownSubtotal().currency());
            total = total.add(knownUnitCost.multiply(quantity));
        }

        private void checkBom(UUID bomId) {
            pricingFor(bomId);
        }

        private BomPricingPort.BomPricing pricingFor(UUID bomId) {
            if (bomId == null) {
                complete = false;
                diagnostics.add(new CostDiagnostic(null, "BOM_REFERENCE_MISSING", "Composition",
                        "Référence de composition absente", true));
                return null;
            }
            // Contract violations and infrastructure failures are errors, not expected missing costs.
            BomPricingPort.BomPricing pricing = Objects.requireNonNull(bomPricingPort.getPricing(bomId),
                    "Le port de valorisation doit retourner un résultat explicite");
            diagnostics.addAll(pricing.diagnostics());
            if (!pricing.complete()) {
                complete = false;
                missingBomIds.add(bomId);
            }
            if (pricing.yieldQuantity() == null || pricing.yieldQuantity().signum() <= 0) {
                complete = false;
                missingBomIds.add(bomId);
                if (pricing.diagnostics().stream().noneMatch(issue -> issue.code().equals("BOM_NOT_FOUND")
                        || issue.code().equals("INVALID_YIELD"))) {
                    diagnostics.add(new CostDiagnostic(bomId, "INVALID_YIELD", "Rendement",
                            "Le rendement de la composition doit être supérieur à zéro", true));
                }
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
            diagnostics.add(new CostDiagnostic(null, "NO_ACTIVE_OPTION", "Options",
                    "Aucune option active pour calculer le pire cas", true));
        }

        private ProductCost result() {
            return new ProductCost(
                    new Money(total.amount().stripTrailingZeros(), total.currency()),
                    complete && missingBomIds.isEmpty(),
                    missingBomIds.stream().distinct().toList(),
                    diagnostics.stream().distinct().toList());
        }

        private boolean complete = true;
    }
}
