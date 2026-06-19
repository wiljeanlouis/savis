package com.savouretplus.savis.catalog.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data repository for product category entities.
 */
interface ProductCategoryJpaRepository extends JpaRepository<ProductCategoryEntity, Long> {
    /**
     * Finds an aggregate by its public identifier.
     */
    Optional<ProductCategoryEntity> findByPublicId(UUID publicId);
    /**
     * Returns entities ordered by display order and name.
     */
    List<ProductCategoryEntity> findAllByOrderByDisplayOrderAscNameAsc();
}
