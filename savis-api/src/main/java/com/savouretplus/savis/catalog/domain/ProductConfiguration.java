package com.savouretplus.savis.catalog.domain;

import java.util.List;

public record ProductConfiguration(
        String purchaseModeCode,
        String choiceCode,
        List<ChoiceAllocation> allocations,
        List<IngredientSelection> ingredients) {

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

    public static ProductConfiguration empty() {
        return new ProductConfiguration(null, null, List.of(), List.of());
    }
}
