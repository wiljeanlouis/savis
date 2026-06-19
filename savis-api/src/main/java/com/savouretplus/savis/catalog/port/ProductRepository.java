package com.savouretplus.savis.catalog.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.catalog.domain.Product;

/**
 * Defines persistence operations for catalog products.
 */
public interface ProductRepository {

    /**
     * Persists the provided aggregate.
     */
    Product save(Product product);

    /**
     * Finds an aggregate by its public identifier.
     */
    Optional<Product> findByPublicId(UUID publicId);

    /**
     * Returns all persisted aggregates.
     */
    List<Product> findAll();

    /**
     * Returns all products currently marked as published.
     */
    List<Product> findAllPublished();

    /**
     * Deletes the provided aggregate.
     */
    void delete(Product product);
}
