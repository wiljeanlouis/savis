package com.savouretplus.savis.recipe.domain;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.recipe.port.IngredientPricePort;
import com.savouretplus.savis.recipe.domain.ingredient.IngredientRequirement;

import lombok.EqualsAndHashCode;
import lombok.Getter;

@Getter
@EqualsAndHashCode(of = "publicId")
public class Recipe {
    private final UUID publicId;

    private final Long id;

    private final String name;

    private final String description;

    private final String imageUrl;

    private final String instructions;

    private final List<IngredientRequirement> ingredients = new ArrayList<>();

    private final Minute cookingMinutes;

    private final Minute preparationMinutes;

    private final Integer servings;

    public Recipe(UUID publicId,
            Long id,
            String name,
            String description,
            String imageUrl,
            String instructions,
            Minute cookingMinutes,
            Minute preparationMinutes,
            Integer servings) {
        this.publicId = publicId != null ? publicId : UUID.randomUUID();
        this.id = id;
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.instructions = instructions;
        this.cookingMinutes = cookingMinutes;
        this.preparationMinutes = preparationMinutes;
        this.servings = servings;
    }

    public List<IngredientRequirement> ingredients() {
        return Collections.unmodifiableList(ingredients);
    }

    public void addIngredient(String name, double value, Unit unit, UUID selectedOfferId) {
        if (ingredients.stream().anyMatch(i -> i.ingredientName().equals(name))) {
            throw new IllegalStateException("Ingredient already exists in the recipe");
        }
        this.ingredients.add(new IngredientRequirement(null, name, new Quantity(value, unit), selectedOfferId));
    }

    public Money calculateTotal(IngredientPricePort calculator) {
        return ingredients.stream()
                .map(ing -> calculator.getPrice(ing.ingredientName(), ing.selectedOfferId()))
                .reduce(Money.ZERO, Money::add);
    }

    public static Recipe merge(Recipe idProvider, Recipe dataProvider) {
        Recipe recipe = new Recipe(
                idProvider.getPublicId(),
                idProvider.getId(),
                dataProvider.name,
                dataProvider.description,
                dataProvider.imageUrl,
                dataProvider.instructions,
                dataProvider.cookingMinutes,
                dataProvider.preparationMinutes,
                dataProvider.servings);

        recipe.ingredients.addAll(dataProvider.ingredients);

        return recipe;

    }

}
