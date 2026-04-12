package com.savouretplus.savis.recipe.application.command;

import java.util.Optional;

import lombok.Builder;

@Builder
public record RecipeUpdateCommand(
        String title,
        String instructions,
        Integer cookingMinutes,
        Integer preparationMinutes) {

    public Optional<String> getOptionalTitle() {
        return Optional.ofNullable(title).filter(t -> !t.isBlank());
    }

    public Optional<String> getOptionalInstructions() {
        return Optional.ofNullable(instructions).filter(i -> !i.isBlank());
    }

    public Optional<Integer> getOptionalCookingMinutes() {
        return Optional.ofNullable(cookingMinutes);
    }

    public Optional<Integer> getOptionalPreparationMinutes() {
        return Optional.ofNullable(preparationMinutes);
    }

}
