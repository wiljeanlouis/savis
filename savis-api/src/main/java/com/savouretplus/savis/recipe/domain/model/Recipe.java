package com.savouretplus.savis.recipe.domain.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.recipe.domain.port.PriceCalculator;

import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;

@Getter
@Builder()
@EqualsAndHashCode(of = "uuid")
public class Recipe {
    private final UUID uuid;

    private Long id;

    private String title;

    private String instructions;

    @Builder.Default
    private final List<IngredientRequirement> ingredients = new ArrayList<>();

    private Minute cookingMinutes;

    private Minute preparationMinutes;

    private Integer servings;

    private String imageUrl;

    public static Recipe from(String title) {
        return Recipe.builder()
                .uuid(UUID.randomUUID())
                .title(title)
                .instructions(String.format("Instructions for %s", title))
                .cookingMinutes(Minute.of(0))
                .preparationMinutes(Minute.of(0))
                .build();
    }

    @Builder
    public static class RecipeUpdateDetails {
        private Optional<String> title;
        private Optional<String> instructions;
        private Optional<Minute> cookingMinutes;
        private Optional<Minute> preparationMinutes;
    }

    public void updateDetails(RecipeUpdateDetails details) {
        details.title.ifPresent(title -> this.title = title);
        details.instructions.ifPresent(instructions -> this.instructions = instructions);
        details.cookingMinutes.ifPresent(cookingMinutes -> this.cookingMinutes = cookingMinutes);
        details.preparationMinutes.ifPresent(preparationMinutes -> this.preparationMinutes = preparationMinutes);
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
