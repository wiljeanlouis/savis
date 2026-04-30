package com.savouretplus.savis.recipe.domain.ingredient;

import java.util.UUID;

import com.savouretplus.savis.common.Money;

public interface IngredientPricePort {

    Money getPrice(String ingredientName, UUID offerId);

}
