package com.savouretplus.savis.recipe.infrastructure.adapter;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import com.savouretplus.savis.recipe.domain.ingredient.IngredientNeededEventPort;
import com.savouretplus.savis.supply.api.IngredientNeededEvent;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class IngredientNeededEventAdapter implements IngredientNeededEventPort {
    private final ApplicationEventPublisher events;

    @Override
    public void publish(String ingredientName) {
        events.publishEvent(new IngredientNeededEvent(ingredientName));
    }

}
