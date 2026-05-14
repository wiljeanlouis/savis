package com.savouretplus.savis.recipe.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.savouretplus.savis.common.IngredientNeededEvent;
import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.recipe.domain.Recipe;
import com.savouretplus.savis.recipe.port.RecipeRepositoryPort;
import com.savouretplus.savis.recipe.port.IngredientNeededEventPort;
import com.savouretplus.savis.recipe.port.IngredientPricePort;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;

@Service
@Transactional
@AllArgsConstructor
public class RecipeService {

    private final RecipeRepositoryPort repository;
    private final IngredientPricePort priceCalculator;
    private final IngredientNeededEventPort ingredientNeedEventPublisher;

    public UUID saveRecipe(Recipe recipe) {

        if (recipe.getPublicId() != null) {
            Recipe idProvider = getRecipe(recipe.getPublicId());
            recipe = Recipe.merge(idProvider, recipe);
            ;
        }

        repository.save(recipe);
        publishIngredientNeededEvents(recipe);

        return recipe.getPublicId();
    }

    public Recipe getRecipe(UUID recipeId) {
        return repository.findByPublicId(recipeId)
                .orElseThrow(() -> new RuntimeException("Recipe not found"));
    }

    public void deleteRecipe(UUID recipeId) {
        Recipe recipe = getRecipe(recipeId);
        repository.delete(recipe);
    }

    public List<Recipe> listRecipes() {
        return repository.findAll();
    }

    public Money calculateTotalCost(UUID recipeId) {
        Recipe recipe = getRecipe(recipeId);
        return recipe.calculateTotal(priceCalculator);
    }

    private void publishIngredientNeededEvents(Recipe recipe) {
        recipe.getIngredients().forEach(i -> {
            if (i.selectedOfferId() == null) {
                ingredientNeedEventPublisher.publish(IngredientNeededEvent.of(i.ingredientName()));
            }
        });
    }

}
