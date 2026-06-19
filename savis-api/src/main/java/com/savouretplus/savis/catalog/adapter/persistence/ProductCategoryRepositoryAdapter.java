package com.savouretplus.savis.catalog.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Repository;

import com.savouretplus.savis.catalog.domain.ProductCategory;
import com.savouretplus.savis.catalog.port.ProductCategoryRepository;

import lombok.AllArgsConstructor;

/**
 * Persists product categories through Spring Data JPA.
 */
@Repository
@AllArgsConstructor
public class ProductCategoryRepositoryAdapter implements ProductCategoryRepository {
    private final ProductCategoryJpaRepository repository;

    /**
     * Persists the provided aggregate.
     */
    @Override
    public ProductCategory save(ProductCategory category) {
        ProductCategoryEntity entity = repository.findByPublicId(category.publicId())
                .orElseGet(ProductCategoryEntity::new);
        entity.setPublicId(category.publicId());
        entity.setCode(category.code());
        entity.setName(category.name());
        entity.setActive(category.active());
        entity.setDisplayOrder(category.displayOrder());
        /**
         * Converts this DTO to its domain representation.
         */
        return toDomain(repository.save(entity));
    }

    /**
     * Finds an aggregate by its public identifier.
     */
    @Override
    public Optional<ProductCategory> findByPublicId(UUID publicId) {
        return repository.findByPublicId(publicId).map(this::toDomain);
    }

    /**
     * Returns all persisted aggregates.
     */
    @Override
    public List<ProductCategory> findAll() {
        return repository.findAllByOrderByDisplayOrderAscNameAsc().stream().map(this::toDomain).toList();
    }

    /**
     * Deletes the provided aggregate.
     */
    @Override
    public void delete(ProductCategory category) {
        repository.findByPublicId(category.publicId()).ifPresent(repository::delete);
    }

    private ProductCategory toDomain(ProductCategoryEntity entity) {
        return new ProductCategory(entity.getPublicId(), entity.getCode(), entity.getName(),
                entity.isActive(), entity.getDisplayOrder());
    }
}
