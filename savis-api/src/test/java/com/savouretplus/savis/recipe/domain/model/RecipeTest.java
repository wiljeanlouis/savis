package com.savouretplus.savis.recipe.domain.model;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.recipe.domain.port.PriceCalculator;

public class RecipeTest {

    @Test
    void testFrom() {
        String title = "Test Recipe";
        Recipe recipe = Recipe.from(title);

        Assertions.assertNotNull(recipe.getUuid());
        Assertions.assertEquals(recipe.getTitle(), title);
    }

    @Test
    void testUpdateDetails() {
        Recipe recipe = Recipe.from("Original Title");
        Recipe.RecipeUpdateDetails details = Recipe.RecipeUpdateDetails.builder()
                .title(Optional.of("Updated Title"))
                .instructions(Optional.of("Updated Instructions"))
                .cookingMinutes(Optional.of(Minute.of(10)))
                .preparationMinutes(Optional.of(Minute.of(5)))
                .build();

        recipe.updateDetails(details);

        Assertions.assertEquals(recipe.getTitle(), "Updated Title");
        Assertions.assertEquals(recipe.getInstructions(), "Updated Instructions");
        Assertions.assertEquals(recipe.getCookingMinutes().value(), 10);
        Assertions.assertEquals(recipe.getPreparationMinutes().value(), 5);
    }

    @Test
    void testAddIngredient() {
        Recipe recipe = Recipe.from("Test Recipe");
        recipe.addIngredient("Flour", 200, Unit.GRAMS, null);

        Assertions.assertEquals(1, recipe.ingredients().size());
        Assertions.assertEquals("Flour", recipe.ingredients().get(0).ingredientName());
        Assertions.assertEquals(200, recipe.ingredients().get(0).quantity().value());
        Assertions.assertEquals(Unit.GRAMS, recipe.ingredients().get(0).quantity().unit());
    }

    @Test
    void testAddIngredient_ShouldThrowIllegalStateExceptionWhenAddingDuplicateIngredient() {
        Recipe recipe = Recipe.from("Test Recipe");
        recipe.addIngredient("Sugar", 100, Unit.GRAMS, null);

        Assertions.assertThrows(IllegalStateException.class, () -> {
            recipe.addIngredient("Sugar", 50, Unit.GRAMS, null);
        });
    }

    @Test
    void testCalculateTotal() {
        Recipe recipe = Recipe.from("Test Recipe");
        recipe.addIngredient("Flour", 200, Unit.GRAMS, UUID.fromString("59960a6c-9491-473a-87e9-3244396096d6"));
        recipe.addIngredient("Sugar", 100, Unit.GRAMS, UUID.fromString("59960a6c-9491-473a-87e9-3244396096d1"));

        PriceCalculator priceCalculator = (offerUuid) -> {
            if (offerUuid.toString().equals("59960a6c-9491-473a-87e9-3244396096d6")) {
                return Money.of(5);
            } else if (offerUuid.toString().equals("59960a6c-9491-473a-87e9-3244396096d1")) {
                return Money.of(20);
            }
            return Money.of(0);
        };

        Money total = recipe.calculateTotal(priceCalculator);
        Assertions.assertEquals(Money.of(25), total);  

    }

}
