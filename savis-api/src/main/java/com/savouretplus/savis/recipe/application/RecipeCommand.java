package com.savouretplus.savis.recipe.application;

import java.util.List;
import java.util.UUID;

import lombok.Builder;

@Builder
public record RecipeCommand(
                UUID id,
                String name,
                String description,
                String imageUrl,
                String instructions,
                Integer cookingMinutes,
                Integer preparationMinutes,
                List<IngredientRequirementCommand> ingredients) {

}
