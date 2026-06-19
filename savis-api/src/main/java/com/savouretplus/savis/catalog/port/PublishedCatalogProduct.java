package com.savouretplus.savis.catalog.port;

import java.util.List;
import java.util.Map;

/**
 * Represents a product payload ready to be published outside the catalog module.
 */
public record PublishedCatalogProduct(
        String id,
        String slug,
        String name,
        String category,
        String description,
        String productType,
        List<Map<String, Object>> purchaseModes,
        Map<String, Object> choiceGroup,
        List<Map<String, Object>> ingredientOptions,
        String unitLabel,
        int priceCents,
        Integer dozenPriceCents,
        String imageUrl,
        List<String> gallery,
        String availabilityNote,
        boolean available,
        int displayOrder) {
}
