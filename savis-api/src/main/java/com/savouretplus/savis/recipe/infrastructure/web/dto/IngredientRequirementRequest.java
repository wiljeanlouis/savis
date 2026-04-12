package com.savouretplus.savis.recipe.infrastructure.web.dto;

import java.util.UUID;

import com.savouretplus.savis.recipe.domain.model.Unit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record IngredientRequirementRequest(
        @NotBlank String ingredientName,
        @NotNull double amount,
        @NotBlank String unit,
        UUID selectedOfferId) {

    public Unit unitEnum() {
        return Unit.valueOf(unit.toUpperCase());
    }

}
