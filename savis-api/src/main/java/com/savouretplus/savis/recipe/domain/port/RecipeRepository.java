package com.savouretplus.savis.recipe.domain.port;

import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.recipe.domain.model.Recipe;

public interface RecipeRepository {

    Optional<Recipe> findByUuid(UUID uuid);

    void save(Recipe recipe);
}
