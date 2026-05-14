package com.savouretplus.savis.recipe.adapter.web;

import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;

import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.recipe.domain.Minute;
import com.savouretplus.savis.recipe.domain.Recipe;
import com.savouretplus.savis.recipe.domain.ingredient.IngredientRequirement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RecipeDto(
        UUID id,
        @NotBlank String name,
        @NotBlank String description,
        @NotBlank String imageUrl,
        String instructions,
        @NotNull Integer cookingMinutes,
        @NotNull Integer preparationMinutes,
        @NotNull List<IngredientRequirementDto> ingredients) {

    public static RecipeDto from(Recipe recipe) {
        return new RecipeDto(
                recipe.getPublicId(),
                recipe.getName(),
                recipe.getDescription(),
                recipe.getImageUrl(),
                recipe.getInstructions(),
                recipe.getCookingMinutes() != null ? recipe.getCookingMinutes().value() : null,
                recipe.getPreparationMinutes() != null ? recipe.getPreparationMinutes().value() : null,
                recipe.getIngredients().stream()
                        .map(IngredientRequirementDto::from)
                        .toList());
    }

    public Recipe toRecipe() {
        Recipe recipe = new Recipe(
                id,
                null,
                name,
                description,
                imageUrl,
                instructions,
                Minute.of(cookingMinutes),
                Minute.of(preparationMinutes),
                1);

        Consumer<IngredientRequirementDto> iConsumer = (i) -> {
            recipe.addIngredient(
                    i.ingredientName(),
                    i.quantity(),
                    i.unitEnum(),
                    i.selectedOfferId());
        };

        ingredients.forEach(iConsumer);

        return recipe;
    }

}

record IngredientRequirementDto(
        @NotBlank String ingredientName,
        @NotNull double quantity,
        @NotBlank String unit,
        UUID selectedOfferId) {

    public Unit unitEnum() {
        return Unit.valueOf(unit.toUpperCase());
    }

    public static IngredientRequirementDto from(IngredientRequirement ingredientRequirement) {
        return new IngredientRequirementDto(
                ingredientRequirement.ingredientName(),
                ingredientRequirement.quantity().value(),
                ingredientRequirement.quantity().unit().name(),
                ingredientRequirement.selectedOfferId());
    }

}
