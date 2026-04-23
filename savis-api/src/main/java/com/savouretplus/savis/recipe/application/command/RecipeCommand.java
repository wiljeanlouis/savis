package com.savouretplus.savis.recipe.application.command;

import java.util.List;

import lombok.Builder;

@Builder
public record RecipeCommand(
        String name,
        String description,
        String imageUrl,
        String instructions,
        Integer cookingMinutes,
        Integer preparationMinutes,
        List<IngredientRequirementCommand> ingredients) {

}
