package com.savouretplus.savis.recipe.application;

import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;

import org.springframework.stereotype.Service;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.recipe.domain.Recipe;
import com.savouretplus.savis.recipe.domain.RecipeRepository;
import com.savouretplus.savis.recipe.domain.ingredient.IngredientNeededEventPort;
import com.savouretplus.savis.recipe.domain.ingredient.IngredientPricePort;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;

@Service
@Transactional
@AllArgsConstructor
public class RecipeService {

    private final RecipeRepository repository;
    private final IngredientPricePort priceCalculator;
    private final IngredientNeededEventPort ingredientNeedEventPublisher;

    public UUID saveRecipe(RecipeCommand recipeCommand) {

        if (recipeCommand.id() != null) {
            return updateRecipe(recipeCommand.id(), recipeCommand);
        }

        Recipe recipe = Recipe.create(
                recipeCommand.name(),
                recipeCommand.description(),
                recipeCommand.imageUrl(),
                recipeCommand.instructions(),
                recipeCommand.cookingMinutes(),
                recipeCommand.preparationMinutes());

        transferIngredients(recipeCommand, recipe);

        repository.save(recipe);
        return recipe.getPublicId();
    }

    public Recipe getRecipe(UUID recipeId) {
        return repository.findByPublicId(recipeId)
                .orElseThrow(() -> new RuntimeException("Recipe not found"));
    }

    public UUID updateRecipe(UUID recipeId, RecipeCommand updateCommand) {
        Recipe recipe = getRecipe(recipeId);

        Recipe updatedRecipe = new Recipe(
                recipe.getPublicId(),
                recipe.getId(),
                updateCommand.name(),
                updateCommand.description(),
                updateCommand.imageUrl(),
                updateCommand.instructions(),
                updateCommand.cookingMinutes(),
                updateCommand.preparationMinutes(),
                recipe.getServings());

        transferIngredients(updateCommand, updatedRecipe);

        repository.save(updatedRecipe);
        return updatedRecipe.getPublicId();
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

    private void transferIngredients(RecipeCommand recipeCommand, Recipe recipe) {

        Consumer<IngredientRequirementCommand> iConsumer = (iCommand) -> {
            recipe.addIngredient(
                    iCommand.ingredientName(),
                    iCommand.quantity(),
                    iCommand.unitEnum(),
                    iCommand.selectedOfferId());

            if (iCommand.selectedOfferId() == null) {
                ingredientNeedEventPublisher.publish(iCommand.ingredientName());
            }

        };

        recipeCommand.ingredients().forEach(iConsumer);
    }

}
