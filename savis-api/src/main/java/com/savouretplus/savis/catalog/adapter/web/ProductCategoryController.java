package com.savouretplus.savis.catalog.adapter.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.savouretplus.savis.catalog.domain.ProductCategory;
import com.savouretplus.savis.catalog.usecase.ProductCategoryService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

/**
 * REST controller exposing catalog category management endpoints.
 */
@RestController
@RequestMapping("/api/catalog/categories")
@CrossOrigin(origins = "http://localhost:5173")
@AllArgsConstructor
public class ProductCategoryController {
    private final ProductCategoryService service;

    /**
     * Returns all resources exposed by this endpoint or service.
     */
    @GetMapping
    public List<ProductCategoryDto> list() {
        return service.list().stream().map(ProductCategoryDto::from).toList();
    }

    /**
     * Creates a new resource from the request payload.
     */
    @PostMapping
    public UUID create(@Valid @RequestBody ProductCategoryDto request) {
        return service.save(request.toDomain());
    }

    /**
     * Updates an existing resource from the request payload.
     */
    @PutMapping("/{categoryId}")
    public UUID update(@PathVariable UUID categoryId, @Valid @RequestBody ProductCategoryDto request) {
        return service.save(new ProductCategory(categoryId, request.code(), request.name(),
                request.active(), request.displayOrder()));
    }

    /**
     * Deletes the provided aggregate.
     */
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> delete(@PathVariable UUID categoryId) {
        service.delete(categoryId);
        return ResponseEntity.noContent().build();
    }
}
