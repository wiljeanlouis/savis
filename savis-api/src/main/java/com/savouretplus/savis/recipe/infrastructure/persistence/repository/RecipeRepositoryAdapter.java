package com.savouretplus.savis.recipe.infrastructure.persistence.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Repository;

import com.savouretplus.savis.recipe.domain.model.Recipe;
import com.savouretplus.savis.recipe.domain.port.RecipeRepository;
import com.savouretplus.savis.recipe.infrastructure.persistence.entity.RecipeEntity;
import com.savouretplus.savis.recipe.infrastructure.persistence.mapper.RecipeMapper;

import lombok.AllArgsConstructor;

@Repository
@AllArgsConstructor
public class RecipeRepositoryAdapter implements RecipeRepository {

    private final JpaRecipeEntityRepository jpaRecipeEntityRepository;
    private final RecipeMapper recipeMapper;

    @Override
    public Optional<Recipe> findByUuid(UUID uuid) {
        return jpaRecipeEntityRepository.findByUuid(uuid)
                .map(recipeMapper::toDomain);
    }

    @Override
    public void save(Recipe recipe) {
        RecipeEntity entity = recipeMapper.fromDomain(recipe);
        jpaRecipeEntityRepository.save(entity);
    }

}
