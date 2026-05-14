package com.savouretplus.savis.recipe.adapter.event;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import com.savouretplus.savis.common.IngredientNeededEvent;
import com.savouretplus.savis.recipe.port.IngredientNeededEventPort;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class IngredientNeededEventAdapter implements IngredientNeededEventPort {
    private final ApplicationEventPublisher events;

    @Override
    public void publish(IngredientNeededEvent ingredientNeededEvent) {
        events.publishEvent(ingredientNeededEvent);
    }

}
