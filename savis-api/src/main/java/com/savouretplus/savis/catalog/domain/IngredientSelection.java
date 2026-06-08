package com.savouretplus.savis.catalog.domain;

public record IngredientSelection(String ingredientCode, int quantity) {

    public IngredientSelection {
        if (ingredientCode == null || ingredientCode.isBlank()) {
            throw new IllegalArgumentException("Le code de l'ingrédient est requis");
        }
    }
}
