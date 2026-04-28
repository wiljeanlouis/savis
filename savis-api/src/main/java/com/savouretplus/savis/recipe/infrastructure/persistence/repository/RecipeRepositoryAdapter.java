package com.savouretplus.savis.recipe.infrastructure.persistence.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Sort;
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
    public Optional<Recipe> findByPublicId(UUID publicId) {
        try {
            return jpaRepository.findByPublicId(publicId)
                    .map(recipeMapper::toDomain);
        } catch (Exception e) {
            throw new RecipePersistenceException(RECIPE_FIND_ERROR, e.getCause());
        }

    }

    @Override
    public void save(Recipe recipe) {
        try {
            RecipeEntity entity = recipeMapper.fromDomain(recipe);
            jpaRepository.save(entity);
        } catch (Exception e) {
            throw new RecipePersistenceException(RECIPE_SAVE_ERROR, e.getCause());
        }
    }

    @Override
    public void delete(Recipe recipe) {
        try {
            RecipeEntity entity = recipeMapper.fromDomain(recipe);
            jpaRepository.deleteById(entity.getId());
        } catch (Exception e) {
            throw new RecipePersistenceException(RECIPE_DELETE_ERROR, e.getCause());
        }
    }

    @Override
    public List<Recipe> findAll() {
        try {
            return jpaRepository.findAll(Sort.by("id").ascending())
                    .stream()
                    .map(recipeMapper::toDomain)
                    .toList();
        } catch (Exception e) {
            throw new RecipePersistenceException(RECIPE_FIND_ALL_ERROR, e.getCause());
        }
    }

}
