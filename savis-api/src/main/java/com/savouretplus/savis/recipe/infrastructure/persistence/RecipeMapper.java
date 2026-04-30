package com.savouretplus.savis.recipe.infrastructure.persistence;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.savouretplus.savis.recipe.domain.Recipe;
import com.savouretplus.savis.recipe.domain.ingredient.IngredientRequirement;
import com.savouretplus.savis.recipe.infrastructure.persistence.ingredient.IngredientRequirementEntity;
import com.savouretplus.savis.recipe.infrastructure.persistence.ingredient.IngredientRequirementMapper;

@Mapper(componentModel = "spring", uses = IngredientRequirementMapper.class)
public interface RecipeMapper {

    Recipe toDomain(RecipeEntity entity);

    @Mapping(source = "recipe.ingredients", target = "ingredients")
    @Mapping(source = "recipe.cookingMinutes.value", target = "cookingMinutes")
    @Mapping(source = "recipe.preparationMinutes.value", target = "preparationMinutes")
    RecipeEntity fromDomain(Recipe recipe);

    List<IngredientRequirement> map(List<IngredientRequirementEntity> entities);

    List<IngredientRequirementEntity> mapToEntities(List<IngredientRequirement> requirements);
}
