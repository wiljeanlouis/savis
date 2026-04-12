package com.savouretplus.savis.recipe.domain.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.recipe.domain.port.PriceCalculator;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode(of = "uuid")
public class Recipe {

    private final UUID uuid;
    private Long id;
    private String title;
    private String instructions;
    private final List<IngredientRequirement> ingredients;

    public static Recipe from(String title) {
        return new Recipe(UUID.randomUUID(), title, "", Collections.emptyList());
    }

    public Recipe(UUID uuid, String title, String instructions, List<IngredientRequirement> ingredients) {
        this.uuid = uuid;
        this.title = title;
        this.instructions = instructions;
        this.ingredients = new ArrayList<>(ingredients);
    }

    public void updateDetails(String updatedTitle, String updatedInstructions) {
        if(updatedTitle == null || updatedTitle.isBlank()) {
            throw new IllegalArgumentException("Le titre ne peut pas être vide");
        }
        if(updatedInstructions == null || updatedInstructions.isBlank()) {
            throw new IllegalArgumentException("Les instructions ne peuvent pas être vides");
        }

        this.title = updatedTitle;
        this.instructions = updatedInstructions;
    }

    public List<IngredientRequirement> ingredients() {
        return Collections.unmodifiableList(ingredients);
    }

    public void addIngredient(String name, double value, Unit unit, UUID selectedOfferId) {
        if (ingredients.stream().anyMatch(i -> i.ingredientName().equals(name))) {
            throw new IllegalStateException("L'ingrédient existe déjà");
        }
        this.ingredients.add(new IngredientRequirement(null, name, new Quantity(value, unit), selectedOfferId));
    }

    public Money calculateTotal(PriceCalculator calculator) {
        return ingredients.stream()
                .map(ing -> calculator.getPrice(ing.selectedOfferId()))
                .reduce(Money.ZERO, Money::add);
    }

}
