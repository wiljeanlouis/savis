package com.savouretplus.savis.catalog.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.catalog.domain.ProductCategory;

/**
 * Defines persistence operations for catalog product categories.
 */
public interface ProductCategoryRepository {

    /**
     * Persists the provided aggregate.
     */
    ProductCategory save(ProductCategory category);

    /**
     * Finds an aggregate by its public identifier.
     */
    Optional<ProductCategory> findByPublicId(UUID publicId);

    /**
     * Returns all persisted aggregates.
     */
    List<ProductCategory> findAll();

    /**
     * Deletes the provided aggregate.
     */
    void delete(ProductCategory category);
}
