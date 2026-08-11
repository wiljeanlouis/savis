package com.savouretplus.savis.catalog.usecase;

import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.catalog.api.CatalogOrderingApi;
import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductChoiceOption;
import com.savouretplus.savis.catalog.domain.ProductConfiguration;
import com.savouretplus.savis.catalog.domain.ProductIngredientOption;
import com.savouretplus.savis.catalog.domain.ProductPurchaseMode;
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
