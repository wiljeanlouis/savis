package com.savouretplus.savis.recipe.infrastructure.web.dto;

import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.recipe.application.command.RecipeCommand;
import com.savouretplus.savis.recipe.domain.model.Recipe;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RecipeDto(
        UUID uuid,
        @NotBlank String title,
        @NotBlank String description,
        @NotBlank String imageUrl,
        String instructions,
        @NotNull Integer cookingMinutes,
        @NotNull Integer preparationMinutes,
        @NotNull List<IngredientRequirementDto> ingredients) {

    public static RecipeDto from(Recipe recipe) {
        return new RecipeDto(
                recipe.getUuid(),
                recipe.getTitle(),
                recipe.getDescription(),
                recipe.getImageUrl(),
                recipe.getInstructions(),
                recipe.getCookingMinutes() != null ? recipe.getCookingMinutes().value() : null,
                recipe.getPreparationMinutes() != null ? recipe.getPreparationMinutes().value() : null,
                recipe.getIngredients().stream()
                        .map(IngredientRequirementDto::from)
                        .toList());
    }

    public RecipeCommand toCommand() {
        return RecipeCommand.builder()
                .title(title)
                .description(description)
                .imageUrl(imageUrl)
                .instructions(instructions)
                .cookingMinutes(cookingMinutes)
                .preparationMinutes(preparationMinutes)
                .ingredients(ingredients.stream().map(IngredientRequirementDto::toCommand).toList())
                .build();
    }

}
