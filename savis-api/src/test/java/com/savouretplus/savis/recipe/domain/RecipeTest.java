package com.savouretplus.savis.recipe.domain;

import java.util.UUID;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.recipe.domain.Recipe;
import com.savouretplus.savis.recipe.domain.ingredient.IngredientPricePort;

public class RecipeTest {

    @Test
    void testCreate() {
        String title = "Test Recipe";
        String description = "This is a test recipe.";
        String imageUrl = "http://example.com/image.jpg";
        String instructions = "1. Do this. 2. Do that.";
        Minute cookingMinutes = Minute.of(30);
        Minute preparationMinutes = Minute.of(15);

        Recipe recipe = new Recipe(
                null,
                null,
                title,
                description,
                imageUrl,
                instructions,
                cookingMinutes,
                preparationMinutes,
                null);

        Assertions.assertNotNull(recipe.getPublicId());
        Assertions.assertEquals(recipe.getName(), title);
        Assertions.assertEquals(recipe.getDescription(), description);
        Assertions.assertEquals(recipe.getImageUrl(), imageUrl);
        Assertions.assertEquals(recipe.getInstructions(), instructions);
        Assertions.assertEquals(recipe.getCookingMinutes().value(), cookingMinutes);
        Assertions.assertEquals(recipe.getPreparationMinutes().value(), preparationMinutes);
    }

    @Test
    void testAddIngredient() {
        Recipe recipe = new Recipe(
                UUID.randomUUID(),
                1L,
                "Oeufs brouillés",
                "Oeufs brouillés",
                "Instructions",
                "image.jpg",
                Minute.of(1),
                Minute.of(2),
                3);

        recipe.addIngredient("Flour", 200, Unit.GRAM, null);

        Assertions.assertEquals(1, recipe.ingredients().size());
        Assertions.assertEquals("Flour", recipe.ingredients().get(0).ingredientName());
        Assertions.assertEquals(200, recipe.ingredients().get(0).quantity().value());
        Assertions.assertEquals(Unit.GRAM, recipe.ingredients().get(0).quantity().unit());
    }

    @Test
    void testAddIngredient_ShouldThrowIllegalStateExceptionWhenAddingDuplicateIngredient() {
        Recipe recipe = new Recipe(
                UUID.randomUUID(),
                1L,
                "Oeufs brouillés",
                "Oeufs brouillés",
                "Instructions",
                "image.jpg",
                Minute.of(1),
                Minute.of(2),
                3);
        recipe.addIngredient("Sugar", 100, Unit.GRAM, null);

        Assertions.assertThrows(IllegalStateException.class, () -> {
            recipe.addIngredient("Sugar", 50, Unit.GRAM, null);
        });
    }

    @Test
    void testCalculateTotal() {
        Recipe recipe = new Recipe(
                UUID.randomUUID(),
                1L,
                "Oeufs brouillés",
                "Oeufs brouillés",
                "Instructions",
                "image.jpg",
                Minute.of(1),
                Minute.of(2),
                3);
        recipe.addIngredient("Flour", 200, Unit.GRAM, UUID.fromString("59960a6c-9491-473a-87e9-3244396096d6"));
        recipe.addIngredient("Sugar", 100, Unit.GRAM, UUID.fromString("59960a6c-9491-473a-87e9-3244396096d1"));

        IngredientPricePort priceCalculator = (name, offerUuid) -> {
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
