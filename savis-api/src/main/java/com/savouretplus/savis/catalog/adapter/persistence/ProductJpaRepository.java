package com.savouretplus.savis.catalog.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ProductJpaRepository extends JpaRepository<ProductEntity, Long> {
    Optional<ProductEntity> findByPublicId(UUID publicId);
    List<ProductEntity> findAllByOrderByDisplayOrderAscNameAsc();
    List<ProductEntity> findByPublishedTrueOrderByDisplayOrderAscNameAsc();
}
