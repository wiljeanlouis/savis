package com.savouretplus.savis.catalog.usecase;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.catalog.api.CatalogOrderingApi;
import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductBom;
import com.savouretplus.savis.catalog.domain.ProductChoiceOption;
import com.savouretplus.savis.catalog.domain.ProductConfiguration;
import com.savouretplus.savis.catalog.domain.ProductIngredientOption;
import com.savouretplus.savis.catalog.domain.ProductPurchaseMode;
import com.savouretplus.savis.catalog.domain.ProductType;
import com.savouretplus.savis.common.Money;

import lombok.AllArgsConstructor;

/**
 * Validates catalog selections and exposes immutable product snapshots for orders.
 */
@Service
@Transactional(readOnly = true)
@AllArgsConstructor
public class CatalogOrderingService implements CatalogOrderingApi {
    private final ProductService products;

    /**
     * Returns the current product, configuration, and pricing snapshots.
     */
    @Override
    public ProductSnapshot snapshot(ProductSelection selection) {
        Product product = product(selection);
        if (!product.available()) {
            throw new IllegalArgumentException("Le produit n'est pas disponible: " + product.name());
        }

        ProductConfiguration configuration = configuration(selection);
        ProductPurchaseMode mode = product.selectedMode(configuration);
        product.validateConfiguration(configuration);

        ChoiceSelectionSnapshot choiceSelection = choiceSelection(product, configuration);
        List<ChoiceAllocationSnapshot> allocations = configuration.allocations().stream()
                .map(value -> {
                    ProductChoiceOption option = product.requireActiveChoice(value.choiceCode());
                    return new ChoiceAllocationSnapshot(option.code(), option.name(), value.quantity());
                })
                .toList();
        List<IngredientSelectionSnapshot> ingredients = product.ingredientOptions().stream()
                .filter(ProductIngredientOption::active)
                .map(option -> new IngredientSelectionSnapshot(
                        option.code(),
                        option.name(),
                        selectedIngredientQuantity(option, configuration),
                        option.defaultQuantity(),
                        cents(option.extraPrice())))
                .toList();

        return new ProductSnapshot(
                product.publicId(),
                product.name(),
                product.commercialType().name(),
                product.productType().name(),
                product.imageUrl(),
                cents(mode.price()),
                cents(product.calculateSalePrice(configuration)),
                new PurchaseModeSnapshot(
                        mode.code(), mode.label(), mode.quantity(), mode.allocationType().name()),
                choiceSelection,
                allocations,
                ingredients);
    }

    /**
     * Resolves every BOM that applies to the selected product configuration.
     */
    @Override
    public BomPlan bomPlan(ProductSelection selection) {
        Product product = product(selection);
        ProductConfiguration configuration = configuration(selection);
        ProductPurchaseMode mode = product.selectedMode(configuration);
        product.validateConfiguration(configuration);

        List<ApplicableBom> applicableBoms = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        for (ProductBom productBom : product.productBoms()) {
            addBom(applicableBoms, warnings, productBom.bomId(), productBom.quantity(), product.name());
        }

        if (product.productType() == ProductType.SINGLE_CHOICE) {
            if (configuration.choiceCode() != null && !configuration.choiceCode().isBlank()) {
                ProductChoiceOption option = product.requireActiveChoice(configuration.choiceCode());
                addBom(applicableBoms, warnings, option.bomId(), BigDecimal.valueOf(mode.quantity()), option.name());
            }
        } else if (product.productType() == ProductType.SINGLE_CHOICE_BUNDLE) {
            if (mode.allocationType() == com.savouretplus.savis.catalog.domain.AllocationType.CHOICE_ALLOCATION) {
                configuration.allocations().forEach(allocation -> {
                    ProductChoiceOption option = product.requireActiveChoice(allocation.choiceCode());
                    addBom(
                            applicableBoms,
                            warnings,
                            option.bomId(),
                            BigDecimal.valueOf(allocation.quantity()),
                            option.name());
                });
            } else if (configuration.choiceCode() != null && !configuration.choiceCode().isBlank()) {
                ProductChoiceOption option = product.requireActiveChoice(configuration.choiceCode());
                addBom(applicableBoms, warnings, option.bomId(), BigDecimal.valueOf(mode.quantity()), option.name());
            }
        } else if (product.productType() == ProductType.INGREDIENT_CUSTOMIZATION) {
            product.ingredientOptions().stream()
                    .filter(ProductIngredientOption::active)
                    .forEach(option -> {
                        int extraQuantity = option.extraQuantity(selectedIngredientQuantity(option, configuration));
                        if (extraQuantity > 0) {
                            addBom(
                                    applicableBoms,
                                    warnings,
                                    option.bomId(),
                                    BigDecimal.valueOf(extraQuantity),
                                    option.name());
                        }
                    });
        }

        return new BomPlan(applicableBoms, warnings);
    }

    private Product product(ProductSelection selection) {
        if (selection == null || selection.productId() == null) {
            throw new IllegalArgumentException("Le produit de la commande est requis");
        }
        try {
            return products.get(selection.productId());
        } catch (ProductNotFoundException exception) {
            throw new IllegalArgumentException(exception.getMessage(), exception);
        }
    }

    private ProductConfiguration configuration(ProductSelection selection) {
        return new ProductConfiguration(
                selection.purchaseModeCode(),
                selection.choiceCode(),
                selection.allocations().stream()
                        .map(value -> new com.savouretplus.savis.catalog.domain.ChoiceAllocation(
                                value.choiceCode(), value.quantity()))
                        .toList(),
                selection.ingredients().stream()
                        .map(value -> new com.savouretplus.savis.catalog.domain.IngredientSelection(
                                value.ingredientCode(), value.quantity()))
                        .toList());
    }

    private void addBom(
            List<ApplicableBom> boms,
            List<String> warnings,
            java.util.UUID bomId,
            BigDecimal quantity,
            String sourceName) {
        if (bomId == null) {
            warnings.add("Aucun BOM n'est associé à " + sourceName);
        } else if (quantity != null && quantity.signum() > 0) {
            boms.add(new ApplicableBom(bomId, quantity.stripTrailingZeros(), sourceName));
        }
    }

    private ChoiceSelectionSnapshot choiceSelection(Product product, ProductConfiguration configuration) {
        if (configuration.choiceCode() == null || configuration.choiceCode().isBlank()) {
            return null;
        }
        ProductChoiceOption option = product.requireActiveChoice(configuration.choiceCode());
        return new ChoiceSelectionSnapshot(option.code(), option.name(), product.choiceGroup().label());
    }

    private int selectedIngredientQuantity(
            ProductIngredientOption option,
            ProductConfiguration configuration) {
        return configuration.ingredients().stream()
                .filter(value -> value.ingredientCode().equals(option.code()))
                .mapToInt(com.savouretplus.savis.catalog.domain.IngredientSelection::quantity)
                .findFirst()
                .orElse(option.defaultQuantity());
    }

    private int cents(Money money) {
        return money.amount().movePointRight(2).setScale(0, RoundingMode.HALF_UP).intValueExact();
    }
}
