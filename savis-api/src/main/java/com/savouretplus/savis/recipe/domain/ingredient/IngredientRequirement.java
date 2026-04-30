package com.savouretplus.savis.recipe.domain.ingredient;

import java.util.UUID;

import com.savouretplus.savis.common.Quantity;

public record IngredientRequirement(
        Long id,
        String ingredientName,
        Quantity quantity,
        UUID selectedOfferId) {

}
