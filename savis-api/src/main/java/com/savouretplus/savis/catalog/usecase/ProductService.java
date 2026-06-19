package com.savouretplus.savis.catalog.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductBom;
import com.savouretplus.savis.catalog.port.BomPricingPort;
import com.savouretplus.savis.catalog.port.ProductCategoryRepository;
import com.savouretplus.savis.catalog.port.ProductRepository;

import lombok.AllArgsConstructor;

/**
 * Coordinates catalog product creation, lookup, listing, update, and deletion.
 */
@Service
@Transactional
@AllArgsConstructor
public class ProductService {
    private final ProductRepository repository;
    private final ProductCategoryRepository categoryRepository;
    private final BomPricingPort bomPricingPort;

    /**
     * Creates a new resource from the request payload.
     */
    public UUID create(Product product) {
        validateCategory(product);
        validateProductBoms(product);
        return repository.save(product).publicId();
    }

    /**
     * Returns one resource by identifier.
     */
    @Transactional(readOnly = true)
    public Product get(UUID productId) {
        return repository.findByPublicId(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
    }

    /**
     * Returns all resources exposed by this endpoint or service.
     */
    @Transactional(readOnly = true)
    public List<Product> list() {
        return repository.findAll();
    }

    /**
     * Updates an existing resource from the request payload.
     */
    public Product update(UUID productId, Product product) {
        get(productId);
        if (!productId.equals(product.publicId())) {
            throw new IllegalArgumentException("L'identifiant du produit ne peut pas être modifié");
        }
        validateCategory(product);
        validateProductBoms(product);
        repository.save(product);
        return get(productId);
    }

    /**
     * Deletes the provided aggregate.
     */
    public void delete(UUID productId) {
        repository.delete(get(productId));
    }

    private void validateCategory(Product product) {
        categoryRepository.findByPublicId(product.categoryId())
                .orElseThrow(() -> new ProductCategoryNotFoundException(product.categoryId()));
    }

    private void validateProductBoms(Product product) {
        for (ProductBom productBom : product.productBoms()) {
            if (!bomPricingPort.exists(productBom.bomId())) {
                throw new IllegalArgumentException("BOM produit introuvable: " + productBom.bomId());
            }
        }
    }
}
