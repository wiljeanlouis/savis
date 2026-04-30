package com.savouretplus.savis.recipe.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecipeRepository {

    Optional<Recipe> findByPublicId(UUID publicId);

    void save(Recipe recipe);

    void delete(Recipe recipe);

    List<Recipe> findAll();
}
