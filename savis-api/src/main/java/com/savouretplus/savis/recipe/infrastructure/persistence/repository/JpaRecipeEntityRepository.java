package com.savouretplus.savis.recipe.infrastructure.persistence.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.savouretplus.savis.recipe.infrastructure.persistence.entity.RecipeEntity;

public interface JpaRecipeEntityRepository extends JpaRepository<RecipeEntity, Long> {

    Optional<RecipeEntity> findByPublicId(java.util.UUID publicId);

}
