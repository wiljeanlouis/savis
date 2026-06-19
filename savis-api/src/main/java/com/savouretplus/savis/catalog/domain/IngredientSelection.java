package com.savouretplus.savis.catalog.domain;

/**
 * Represents the selected quantity for a product ingredient option.
 */
public record IngredientSelection(String ingredientCode, int quantity) {

    /**
     * Validates a selected ingredient quantity.
     */
    public IngredientSelection {
        if (ingredientCode == null || ingredientCode.isBlank()) {
            throw new IllegalArgumentException("Le code de l'ingrédient est requis");
        }
    }
}
