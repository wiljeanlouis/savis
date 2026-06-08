package com.savouretplus.savis.catalog.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ProductCategoryJpaRepository extends JpaRepository<ProductCategoryEntity, Long> {
    Optional<ProductCategoryEntity> findByPublicId(UUID publicId);
    List<ProductCategoryEntity> findAllByOrderByDisplayOrderAscNameAsc();
}
