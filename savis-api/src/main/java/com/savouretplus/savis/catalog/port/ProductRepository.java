package com.savouretplus.savis.catalog.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.catalog.domain.Product;

public interface ProductRepository {

    Product save(Product product);

    Optional<Product> findByPublicId(UUID publicId);

    List<Product> findAll();

    List<Product> findAllPublished();

    void delete(Product product);
}
