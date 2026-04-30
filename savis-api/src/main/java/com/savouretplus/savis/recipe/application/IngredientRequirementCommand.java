package com.savouretplus.savis.recipe.application;

import java.util.UUID;

import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.recipe.domain.ingredient.IngredientRequirement;

import lombok.Builder;

@Builder
public record IngredientRequirementCommand(
        String ingredientName,
        double quantity,
        String unit,
        UUID selectedOfferId) {

    public Unit unitEnum() {
        return Unit.valueOf(unit.toUpperCase());
    }

    public static IngredientRequirementCommand from(IngredientRequirement ingredientRequirement) {
        return new IngredientRequirementCommand(
                ingredientRequirement.ingredientName(),
                ingredientRequirement.quantity().value(),
                ingredientRequirement.quantity().unit().name(),
                ingredientRequirement.selectedOfferId());
    }

}
