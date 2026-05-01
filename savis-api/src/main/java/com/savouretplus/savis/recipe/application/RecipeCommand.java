package com.savouretplus.savis.recipe.application;

import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;

import com.savouretplus.savis.recipe.domain.Minute;
import com.savouretplus.savis.recipe.domain.Recipe;
import com.savouretplus.savis.recipe.domain.ingredient.IngredientRequirement;

import lombok.Builder;

@Builder
public record RecipeCommand(
        UUID publicId,
        String name,
        String description,
        String imageUrl,
        String instructions,
        Integer cookingMinutes,
        Integer preparationMinutes,
        List<IngredientRequirementCommand> ingredients) {

    public Recipe toRecipe() {
        Recipe recipe = new Recipe(
                publicId,
                null,
                name,
                description,
                imageUrl,
                instructions,
                Minute.of(cookingMinutes),
                Minute.of(preparationMinutes),
                1);

        Consumer<IngredientRequirementCommand> iConsumer = (iCommand) -> {
            recipe.addIngredient(
                    iCommand.ingredientName(),
                    iCommand.quantity(),
                    iCommand.unitEnum(),
                    iCommand.selectedOfferId());
        };

        ingredients.forEach(iConsumer);

        return recipe;
    }

}
