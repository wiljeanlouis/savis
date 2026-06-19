package com.savouretplus.savis.catalog.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data repository for catalog product entities.
 */
interface ProductJpaRepository extends JpaRepository<ProductEntity, Long> {
    /**
     * Finds an aggregate by its public identifier.
     */
    Optional<ProductEntity> findByPublicId(UUID publicId);
    /**
     * Returns entities ordered by display order and name.
     */
    List<ProductEntity> findAllByOrderByDisplayOrderAscNameAsc();
    /**
     * Finds a value by published true order by display order asc name asc.
     */
    List<ProductEntity> findByPublishedTrueOrderByDisplayOrderAscNameAsc();
}
