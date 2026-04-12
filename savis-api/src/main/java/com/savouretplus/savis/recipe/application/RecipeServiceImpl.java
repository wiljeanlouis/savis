package com.savouretplus.savis.recipe.application;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.recipe.application.command.RecipeUpdateCommand;
import com.savouretplus.savis.recipe.domain.model.Minute;
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
    public UUID createRecipe(String title) {
        Recipe recipe = Recipe.from(title);
        repository.save(recipe);
        return recipe.getUuid();
    }

    @Override
    public Recipe getRecipe(UUID recipeId) {
        return repository.findByUuid(recipeId)
                .orElseThrow(() -> new RuntimeException("Recipe not found"));
    }

    @Override
    public UUID updateRecipe(UUID recipeId, RecipeUpdateCommand updateCommand) {
        Recipe recipe = getRecipe(recipeId);
        Recipe.RecipeUpdateDetails details = Recipe.RecipeUpdateDetails.builder()
                .title(updateCommand.getOptionalTitle())
                .instructions(updateCommand.getOptionalInstructions())
                .cookingMinutes(updateCommand.getOptionalCookingMinutes().map(Minute::of))
                .preparationMinutes(updateCommand.getOptionalPreparationMinutes().map(Minute::of))
                .build();
        recipe.updateDetails(details);
        repository.save(recipe);
        return recipe.getUuid();
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
    public void addIngredient(UUID recipeId, String ingredientName, double amount, Unit unit, UUID selectedOfferId) {
        Recipe recipe = getRecipe(recipeId);
        recipe.addIngredient(ingredientName, amount, unit, selectedOfferId);
        repository.save(recipe);
    }

    @Override
    public void removeIngredient(UUID recipeId, UUID ingredientRequirementId) {
        // TODO Auto-generated method stub

    }

}
