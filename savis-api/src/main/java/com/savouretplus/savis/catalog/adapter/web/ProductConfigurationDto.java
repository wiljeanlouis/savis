package com.savouretplus.savis.catalog.adapter.web;

import java.util.List;

import com.savouretplus.savis.catalog.domain.ChoiceAllocation;
import com.savouretplus.savis.catalog.domain.IngredientSelection;
import com.savouretplus.savis.catalog.domain.ProductConfiguration;

/**
 * DTO used to receive selected product configuration data from the web API.
 */
public record ProductConfigurationDto(
        String purchaseModeCode,
        String choiceCode,
        List<ChoiceAllocation> allocations,
        List<IngredientSelection> ingredients) {
    ProductConfiguration toDomain() {
        return new ProductConfiguration(purchaseModeCode, choiceCode, allocations, ingredients);
    }
}
