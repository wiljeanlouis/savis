package com.savouretplus.savis.catalog.domain;

import java.util.List;

/**
 * Represents a customer-facing product configuration used for price calculation.
 */
public record ProductConfiguration(
        String purchaseModeCode,
        String choiceCode,
        List<ChoiceAllocation> allocations,
        List<IngredientSelection> ingredients) {

    /**
     * Normalizes selected choices, ingredients, and allocations.
     */
    public ProductConfiguration {
        allocations = allocations != null ? List.copyOf(allocations) : List.of();
        ingredients = ingredients != null ? List.copyOf(ingredients) : List.of();
        Product.requireUniqueCodes(
                allocations.stream().map(ChoiceAllocation::choiceCode).toList(),
                "allocation");
        Product.requireUniqueCodes(
                ingredients.stream().map(IngredientSelection::ingredientCode).toList(),
                "sélection d'ingrédient");
    }

    /**
     * Creates an empty product configuration.
     */
    public static ProductConfiguration empty() {
        return new ProductConfiguration(null, null, List.of(), List.of());
    }
}
