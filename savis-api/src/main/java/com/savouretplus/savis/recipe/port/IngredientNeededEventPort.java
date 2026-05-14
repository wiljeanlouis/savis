package com.savouretplus.savis.recipe.port;

import com.savouretplus.savis.common.IngredientNeededEvent;

public interface IngredientNeededEventPort {
    void publish(IngredientNeededEvent ingredientNeededEvent);

}
