package com.savouretplus.savis.recipe.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.recipe.domain.Recipe;

public interface RecipeRepositoryPort {

    Optional<Recipe> findByPublicId(UUID publicId);

    void save(Recipe recipe);

    void delete(Recipe recipe);

    List<Recipe> findAll();
}
