package com.savouretplus.savis.recipe.infrastructure.persistence.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Repository;

import com.savouretplus.savis.recipe.domain.model.Recipe;
import com.savouretplus.savis.recipe.domain.port.RecipeRepository;
import com.savouretplus.savis.recipe.infrastructure.persistence.entity.RecipeEntity;
import com.savouretplus.savis.recipe.infrastructure.persistence.exception.RecipePersistenceException;
import com.savouretplus.savis.recipe.infrastructure.persistence.mapper.RecipeMapper;

import lombok.AllArgsConstructor;

@Repository
@AllArgsConstructor
public class RecipeRepositoryAdapter implements RecipeRepository {

    private static final String RECIPE_FIND_ERROR = "RECIPE_FIND_ERROR";
    private static final String RECIPE_SAVE_ERROR = "RECIPE_SAVE_ERROR";
    private static final String RECIPE_DELETE_ERROR = "RECIPE_DELETE_ERROR";
    private static final String RECIPE_FIND_ALL_ERROR = "RECIPE_FIND_ALL_ERROR";

    private final JpaRecipeEntityRepository jpaRepository;
    private final RecipeMapper recipeMapper;

    @Override
    public Optional<Recipe> findByUuid(UUID uuid) {
        try {
            return jpaRepository.findByUuid(uuid)
                    .map(recipeMapper::toDomain);
        } catch (DataAccessException e) {
            throw new RecipePersistenceException(RECIPE_FIND_ERROR, e.getMostSpecificCause());
        }

    }

    @Override
    public void save(Recipe recipe) {
        try {
            RecipeEntity entity = recipeMapper.fromDomain(recipe);
            jpaRepository.save(entity);
        } catch (DataAccessException e) {
            throw new RecipePersistenceException(RECIPE_SAVE_ERROR, e.getMostSpecificCause());
        }
    }

    @Override
    public void delete(Recipe recipe) {
        try {
            RecipeEntity entity = recipeMapper.fromDomain(recipe);
            jpaRepository.deleteById(entity.getId());
        } catch (DataAccessException e) {
            throw new RecipePersistenceException(RECIPE_DELETE_ERROR, e.getMostSpecificCause());
        }
    }

    @Override
    public List<Recipe> findAll() {
        try {
            return jpaRepository.findAll()
                    .stream()
                    .map(recipeMapper::toDomain)
                    .toList();
        } catch (DataAccessException e) {
            throw new RecipePersistenceException(RECIPE_FIND_ALL_ERROR, e.getMostSpecificCause());
        }
    }

}
