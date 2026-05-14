package com.savouretplus.savis.recipe.port;

import java.util.UUID;

import com.savouretplus.savis.common.Money;

public interface IngredientPricePort {

    Money getPrice(String ingredientName, UUID offerId);

}
