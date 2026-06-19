package com.savouretplus.savis.catalog.adapter.web;

import java.util.UUID;

import com.savouretplus.savis.catalog.domain.ProductCategory;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO used to exchange catalog category data over the web API.
 */
public record ProductCategoryDto(
        UUID id, @NotBlank String code, @NotBlank String name, boolean active, int displayOrder) {
    /**
     * Converts this DTO into its domain representation.
     */
    ProductCategory toDomain() {
        return new ProductCategory(id, code, name, active, displayOrder);
    }

    /**
     * Creates a DTO from a product category.
     */
    static ProductCategoryDto from(ProductCategory category) {
        return new ProductCategoryDto(category.publicId(), category.code(), category.name(),
                category.active(), category.displayOrder());
    }
}
