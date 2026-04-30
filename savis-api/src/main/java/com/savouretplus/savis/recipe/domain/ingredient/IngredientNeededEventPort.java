package com.savouretplus.savis.recipe.domain.ingredient;

public interface IngredientNeededEventPort {
    void publish(String ingredientName);

}
