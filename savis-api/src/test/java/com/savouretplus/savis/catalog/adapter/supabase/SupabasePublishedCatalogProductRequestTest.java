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
    }

    @Test
    void preservesAnUnclassifiedProduct() {
        PublishedCatalogProduct product = product(null);

        assertNull(SupabasePublishedCatalogProductRequest.from(product).subcategory());
    }

    private PublishedCatalogProduct product(String subcategory) {
        return new PublishedCatalogProduct(
                "product-1", "product", "Produit", "decoration", subcategory,
                "", "standard", List.of(), null, List.of(), "/image.jpg",
                List.of(), "Disponible", true, 0);
    }
}
