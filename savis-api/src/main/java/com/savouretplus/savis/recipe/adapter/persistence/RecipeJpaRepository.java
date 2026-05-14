package com.savouretplus.savis.recipe.adapter.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RecipeJpaRepository extends JpaRepository<RecipeEntity, Long> {

    Optional<RecipeEntity> findByPublicId(java.util.UUID publicId);

}
