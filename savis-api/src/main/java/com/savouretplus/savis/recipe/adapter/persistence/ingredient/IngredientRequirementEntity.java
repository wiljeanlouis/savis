package com.savouretplus.savis.recipe.adapter.persistence.ingredient;

import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Entity(name = "ingredient_requirements")
public class IngredientRequirementEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ingredientName;

    private double quantity;

    private String unit;

    private UUID selectedOfferId;
}
