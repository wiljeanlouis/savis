package com.savouretplus.savis.common;

public record IngredientNeededEvent(String ingredientNameKey) {

    public static IngredientNeededEvent of(String ingredientNameKey) {
        return new IngredientNeededEvent(ingredientNameKey);
    }

}
