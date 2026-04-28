package com.savouretplus.savis.recipe.domain.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.recipe.domain.port.PriceCalculator;

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

    public Recipe(UUID publicId, Long id, String name, String description, String imageUrl, String instructions,
            Integer cookingMinutes, Integer preparationMinutes, Integer servings) {
        this.publicId = publicId;
        this.id = id;
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.instructions = instructions;
        this.cookingMinutes = cookingMinutes != null ? Minute.of(cookingMinutes) : null;
        this.preparationMinutes = preparationMinutes != null ? Minute.of(preparationMinutes) : null;
        this.servings = servings;
    }

    public static Recipe create(String name, String description, String imageUrl, String instructions,
            Integer cookingMinutes,
            Integer preparationMinutes) {
        return new Recipe(UUID.randomUUID(), null, name, description, imageUrl, instructions, cookingMinutes,
                preparationMinutes, 1);
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

    public Money calculateTotal(PriceCalculator calculator) {
        return ingredients.stream()
                .map(ing -> calculator.getPrice(ing.selectedOfferId()))
                .reduce(Money.ZERO, Money::add);
    }

}
