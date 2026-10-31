package com.savouretplus.savis.order.adapter.catalog;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.catalog.api.CatalogOrderingApi;
import com.savouretplus.savis.order.domain.OrderItemAllocationType;
import com.savouretplus.savis.order.domain.OrderItemProductType;
import com.savouretplus.savis.order.port.OrderCatalog;

import lombok.AllArgsConstructor;

/**
 * Adapts the catalog ordering API to the order module catalog port.
 */
@Component
@AllArgsConstructor
public class CatalogOrderAdapter implements OrderCatalog {
    private final CatalogOrderingApi catalog;

    /**
     * Returns a validated order product snapshot for the selected configuration.
     */
    @Override
    public ProductSnapshot snapshot(ProductSelection selection) {
        CatalogOrderingApi.ProductSnapshot source = catalog.snapshot(toCatalogSelection(selection));

        CatalogOrderingApi.PurchaseModeSnapshot mode = source.purchaseMode();
        CatalogOrderingApi.ChoiceSelectionSnapshot choice = source.choiceSelection();
        return new ProductSnapshot(
                source.productId(),
                source.productName(),
                OrderItemProductType.valueOf(source.productType()),
                source.imageUrl(),
                source.basePriceCents(),
                source.unitPriceCents(),
                new PurchaseMode(
                        mode.code(), mode.label(), mode.quantity(),
                        OrderItemAllocationType.valueOf(mode.allocationType())),
                choice == null ? null : new ChoiceSelection(choice.code(), choice.name(), choice.groupLabel()),
                source.choiceAllocations().stream()
                        .map(value -> new ChoiceAllocationSnapshot(
                                value.code(), value.name(), value.quantity()))
                        .toList(),
                source.ingredientSelections().stream()
                        .map(value -> new IngredientSelectionSnapshot(
                                value.code(), value.name(), value.quantity(),
                                value.defaultQuantity(), value.extraPriceCents()))
                        .toList());
    }

    /**
     * Resolves current catalog BOM contributions for an ordered configuration.
     */
    @Override
    public BomPlan bomPlan(ProductSelection selection) {
        CatalogOrderingApi.BomPlan source = catalog.bomPlan(toCatalogSelection(selection));
        return new BomPlan(
                source.boms().stream()
                        .map(value -> new ApplicableBom(
                                value.bomId(), value.quantity(), value.sourceName()))
                        .toList(),
                source.warnings());
    }

    private CatalogOrderingApi.ProductSelection toCatalogSelection(ProductSelection selection) {
        return new CatalogOrderingApi.ProductSelection(
                selection.productId(),
                selection.purchaseModeCode(),
                selection.choiceCode(),
                selection.allocations().stream()
                        .map(value -> new CatalogOrderingApi.ChoiceAllocation(
                                value.choiceCode(), value.quantity()))
                        .toList(),
                selection.ingredients().stream()
                        .map(value -> new CatalogOrderingApi.IngredientSelection(
                                value.ingredientCode(), value.quantity()))
                        .toList());
    }
}
