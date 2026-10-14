package com.savouretplus.savis.catalog.adapter.supabase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.savouretplus.savis.catalog.port.PublishedCatalogProduct;

class SupabasePublishedCatalogProductRequestTest {

    @Test
    void includesThePublicSubcategoryCode() {
        PublishedCatalogProduct product = product("balloon-arch");

        assertEquals("balloon-arch",
                SupabasePublishedCatalogProductRequest.from(product).subcategory());
        assertEquals("service",
                SupabasePublishedCatalogProductRequest.from(product).commercialType());
    }

    @Test
    void preservesAnUnclassifiedProduct() {
        PublishedCatalogProduct product = product(null);

        assertNull(SupabasePublishedCatalogProductRequest.from(product).subcategory());
    }

    private PublishedCatalogProduct product(String subcategory) {
        return new PublishedCatalogProduct(
                "product-1", "product", "Produit", "decoration", subcategory,
                "", "service", "standard", List.of(), null, List.of(), "/image.jpg",
                List.of(), "Disponible", true, 0);
    }
}
