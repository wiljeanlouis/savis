package com.savouretplus.savis.recipe.infrastructure.web.dto;

import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.recipe.domain.model.IngredientRequirement;
import com.savouretplus.savis.recipe.domain.model.Recipe;

public record RecipeResponse(
        UUID uuid,
        String title,
        String instructions,
        List<IngredientRequirement> ingredients) {

    public static RecipeResponse from(Recipe recipe) {
        return new RecipeResponse(
                recipe.getUuid(),
                recipe.getTitle(),
                recipe.getInstructions(),
                recipe.getIngredients());
    }

}
