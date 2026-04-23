package com.savouretplus.savis.recipe.infrastructure.persistence.entity;

import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Entity(name = "recipes")
public class RecipeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private UUID uuid;

    @Column(unique = true, nullable = false)
    private String title;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String imageUrl;

    @Column(nullable = true)
    private String instructions;

    @Column(nullable = false)
    private Integer cookingMinutes;

    @Column(nullable = false)
    private Integer preparationMinutes;

    @Column(nullable = false)
    private Integer servings;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    private List<IngredientRequirementEntity> ingredients;

}
