package com.savouretplus.savis.recipe.domain.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.recipe.domain.model.Recipe;

public interface RecipeRepository {

    Optional<Recipe> findByUuid(UUID uuid);

    void save(Recipe recipe);

    void delete(Recipe recipe);

    List<Recipe> findAll();
}
