package com.savouretplus.savis.recipe.application;

import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.recipe.domain.model.Recipe;
import com.savouretplus.savis.recipe.domain.model.Unit;

public interface RecipeService {
    UUID createRecipe(String title);

    Recipe getRecipe(UUID recipeId);

    UUID updateRecipe(UUID recipeId, String title, String instructions);

    void deleteRecipe(UUID recipeId);

    Money calculateTotalCost(UUID recipeId);

    void addIngredient(UUID recipeId, String ingredientName, double amount, Unit unit, UUID selectedOfferId);

    void removeIngredient(UUID recipeId, UUID ingredientRequirementId);

}
