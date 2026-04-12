package com.savouretplus.savis.recipe.infrastructure.persistence.repository;

import java.util.List;
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

    private final JpaRecipeEntityRepository jpaRepository;
    private final RecipeMapper recipeMapper;

    @Override
    public Optional<Recipe> findByUuid(UUID uuid) {
        return jpaRepository.findByUuid(uuid)
                .map(recipeMapper::toDomain);
    }

    @Override
    public void save(Recipe recipe) {
        RecipeEntity entity = recipeMapper.fromDomain(recipe);
        jpaRepository.save(entity);
    }

    @Override
    public void delete(Recipe recipe) {
        RecipeEntity entity = recipeMapper.fromDomain(recipe);
        jpaRepository.deleteById(entity.getId());
    }

    @Override
    public List<Recipe> findAll() {
        return jpaRepository.findAll()
                .stream()
                .map(recipeMapper::toDomain)
                .toList();
    }

}
