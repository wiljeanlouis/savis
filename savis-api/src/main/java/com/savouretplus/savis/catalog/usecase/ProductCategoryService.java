package com.savouretplus.savis.catalog.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.catalog.domain.ProductCategory;
import com.savouretplus.savis.catalog.port.ProductCategoryRepository;

import lombok.AllArgsConstructor;

/**
 * Coordinates catalog category creation, lookup, listing, update, and deletion.
 */
@Service
@Transactional
@AllArgsConstructor
public class ProductCategoryService {

    private final ProductCategoryRepository repository;

    /**
     * Persists the provided aggregate.
     */
    public UUID save(ProductCategory category) {
        return repository.save(category).publicId();
    }

    /**
     * Returns one resource by identifier.
     */
    @Transactional(readOnly = true)
    public ProductCategory get(UUID categoryId) {
        return repository.findByPublicId(categoryId)
                .orElseThrow(() -> new ProductCategoryNotFoundException(categoryId));
    }

    /**
     * Returns all resources exposed by this endpoint or service.
     */
    @Transactional(readOnly = true)
    public List<ProductCategory> list() {
        return repository.findAll();
    }

    /**
     * Deletes the provided aggregate.
     */
    public void delete(UUID categoryId) {
        repository.delete(get(categoryId));
    }
}
