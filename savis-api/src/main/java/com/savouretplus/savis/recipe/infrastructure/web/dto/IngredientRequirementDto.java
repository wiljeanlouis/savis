package com.savouretplus.savis.recipe.infrastructure.web.dto;

import java.util.UUID;

import com.savouretplus.savis.recipe.application.command.IngredientRequirementCommand;
import com.savouretplus.savis.recipe.domain.model.IngredientRequirement;
import com.savouretplus.savis.recipe.domain.model.Unit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record IngredientRequirementDto(
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
                ingredientRequirement.selectedOfferId()
        );
    }

    public IngredientRequirementCommand toCommand() {
        return IngredientRequirementCommand.builder()
                .ingredientName(ingredientName)
                .quantity(quantity)
                .unit(unit)
                .selectedOfferId(selectedOfferId)
                .build();
    }

}
