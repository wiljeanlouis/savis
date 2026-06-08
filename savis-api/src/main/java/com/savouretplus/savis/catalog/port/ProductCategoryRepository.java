package com.savouretplus.savis.catalog.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.catalog.domain.ProductCategory;

public interface ProductCategoryRepository {

    ProductCategory save(ProductCategory category);

    Optional<ProductCategory> findByPublicId(UUID publicId);

    List<ProductCategory> findAll();

    void delete(ProductCategory category);
}
