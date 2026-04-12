package com.savouretplus.savis.recipe.domain.model;

import java.util.UUID;

public record IngredientRequirement(
        Long id,
        String ingredientName,
        Quantity quantity,
        UUID selectedOfferId) {

}
