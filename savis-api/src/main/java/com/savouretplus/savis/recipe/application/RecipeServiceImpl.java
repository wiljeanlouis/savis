package com.savouretplus.savis.recipe.application;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.recipe.application.command.RecipeCommand;
import com.savouretplus.savis.recipe.domain.model.Recipe;
import com.savouretplus.savis.recipe.domain.model.Unit;
import com.savouretplus.savis.recipe.domain.port.PriceCalculator;
import com.savouretplus.savis.recipe.domain.port.RecipeRepository;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;

@Service
@Transactional
@AllArgsConstructor
class RecipeServiceImpl implements RecipeService {

    private final RecipeRepository repository;
    private final PriceCalculator priceCalculator;

    @Override
    public UUID createRecipe(RecipeCommand recipeCommand) {
        Recipe recipe = Recipe.create(
                recipeCommand.name(),
                recipeCommand.description(),
                recipeCommand.imageUrl(),
                recipeCommand.instructions(),
                recipeCommand.cookingMinutes(),
                recipeCommand.preparationMinutes());

        recipeCommand.ingredients()
                .forEach(ingredientCommand -> recipe.addIngredient(ingredientCommand.ingredientName(),
                        ingredientCommand.quantity(), ingredientCommand.unitEnum(), ingredientCommand.selectedOfferId()));

        repository.save(recipe);
        return recipe.getUuid();
    }

    @Override
    public Recipe getRecipe(UUID recipeId) {
        return repository.findByUuid(recipeId)
                .orElseThrow(() -> new RuntimeException("Recipe not found"));
    }

    @Override
    public UUID updateRecipe(UUID recipeId, RecipeCommand updateCommand) {
        Recipe recipe = getRecipe(recipeId);

        Recipe updatedRecipe = new Recipe(
                recipe.getUuid(),
                recipe.getId(),
                updateCommand.name(),
                updateCommand.description(),
                updateCommand.imageUrl(),
                updateCommand.instructions(),
                updateCommand.cookingMinutes(),
                updateCommand.preparationMinutes(),
                recipe.getServings());

        updateCommand.ingredients()
                .forEach(ingredientCommand -> updatedRecipe.addIngredient(ingredientCommand.ingredientName(),
                        ingredientCommand.quantity(), ingredientCommand.unitEnum(), ingredientCommand.selectedOfferId()));

        repository.save(updatedRecipe);
        return updatedRecipe.getUuid();
    }

    @Override
    public void deleteRecipe(UUID recipeId) {
        Recipe recipe = getRecipe(recipeId);
        repository.delete(recipe);
    }

    @Override
    public List<Recipe> listRecipes() {
        return repository.findAll();
    }

    @Override
    public Money calculateTotalCost(UUID recipeId) {
        Recipe recipe = getRecipe(recipeId);
        return recipe.calculateTotal(priceCalculator);
    }

    @Override
    public void addIngredient(UUID recipeId, String ingredientName, double quantity, Unit unit, UUID selectedOfferId) {
        Recipe recipe = getRecipe(recipeId);
        recipe.addIngredient(ingredientName, quantity, unit, selectedOfferId);
        repository.save(recipe);
    }

    @Override
    public void removeIngredient(UUID recipeId, UUID ingredientRequirementId) {
        // TODO Auto-generated method stub

    }

}
