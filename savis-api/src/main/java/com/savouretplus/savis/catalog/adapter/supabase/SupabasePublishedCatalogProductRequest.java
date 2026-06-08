package com.savouretplus.savis.catalog.adapter.supabase;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.savouretplus.savis.catalog.port.PublishedCatalogProduct;

record SupabasePublishedCatalogProductRequest(
        String id,
        String slug,
        String name,
        String category,
        String description,
        @JsonProperty("product_type") String productType,
        @JsonProperty("purchase_modes") List<Map<String, Object>> purchaseModes,
        @JsonProperty("choice_group") Map<String, Object> choiceGroup,
        @JsonProperty("ingredient_options") List<Map<String, Object>> ingredientOptions,
        @JsonProperty("unit_label") String unitLabel,
        @JsonProperty("price_cents") int priceCents,
        @JsonProperty("dozen_price_cents") Integer dozenPriceCents,
        @JsonProperty("image_url") String imageUrl,
        List<String> gallery,
        @JsonProperty("availability_note") String availabilityNote,
        @JsonProperty("is_available") boolean available,
        @JsonProperty("display_order") int displayOrder) {

    static SupabasePublishedCatalogProductRequest from(PublishedCatalogProduct product) {
        return new SupabasePublishedCatalogProductRequest(
                product.id(),
                product.slug(),
                product.name(),
                product.category(),
                product.description(),
                product.productType(),
                product.purchaseModes(),
                product.choiceGroup(),
                product.ingredientOptions(),
                product.unitLabel(),
                product.priceCents(),
                product.dozenPriceCents(),
                product.imageUrl(),
                product.gallery(),
                product.availabilityNote(),
                product.available(),
                product.displayOrder());
    }
}
