package com.savouretplus.savis.recipe.adapter.persistence;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.savouretplus.savis.recipe.adapter.persistence.ingredient.IngredientRequirementEntity;
import com.savouretplus.savis.recipe.adapter.persistence.ingredient.IngredientRequirementMapper;
import com.savouretplus.savis.recipe.domain.Recipe;
import com.savouretplus.savis.recipe.domain.ingredient.IngredientRequirement;

@Mapper(componentModel = "spring", uses = IngredientRequirementMapper.class)
public interface RecipeMapper {

    @Mapping(source = "entity.cookingMinutes", target = "cookingMinutes.value")
    @Mapping(source = "entity.preparationMinutes", target = "preparationMinutes.value")
    Recipe toDomain(RecipeEntity entity);

    @Mapping(source = "recipe.ingredients", target = "ingredients")
    @Mapping(source = "recipe.cookingMinutes.value", target = "cookingMinutes")
    @Mapping(source = "recipe.preparationMinutes.value", target = "preparationMinutes")
    RecipeEntity fromDomain(Recipe recipe);

    List<IngredientRequirement> map(List<IngredientRequirementEntity> entities);

    List<IngredientRequirementEntity> mapToEntities(List<IngredientRequirement> requirements);
}
