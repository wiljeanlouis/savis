package com.savouretplus.savis.catalog.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.savouretplus.savis.catalog.domain.AllocationType;
import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductCategory;
import com.savouretplus.savis.catalog.domain.ProductChoiceGroup;
import com.savouretplus.savis.catalog.domain.ProductChoiceOption;
import com.savouretplus.savis.catalog.domain.ProductType;
import com.savouretplus.savis.catalog.port.PublishedCatalogProduct;
import com.savouretplus.savis.common.Money;

class PublishedCatalogProductMapperTest {

    @Test
    void publishesOnlyActiveCustomerFacingConfiguration() {
        UUID bomId = UUID.randomUUID();
        Product product = new Product(
                null, "pate-four", "pate-four", "Pâté au four", "",
                ProductType.SINGLE_CHOICE_BUNDLE, UUID.randomUUID(), List.of(),
                new BigDecimal("0.35"), "/pate.jpg",
                List.of("/pate-2.jpg"), "Disponible", true, true, 1,
                List.of(
                        new com.savouretplus.savis.catalog.domain.ProductPurchaseMode(
                                null, "dozen", "Douzaine", 12, Money.of(30),
                                AllocationType.CHOICE_ALLOCATION, true, 0),
                        new com.savouretplus.savis.catalog.domain.ProductPurchaseMode(
                                null, "hidden", "Caché", 1, Money.of(1),
                                AllocationType.NONE, false, 1)),
                new ProductChoiceGroup(null, "Farce", true, List.of(
                        new ProductChoiceOption(null, "chicken", "Poulet", bomId, true, 0),
                        new ProductChoiceOption(null, "hidden", "Caché", null, false, 1))),
                List.of());

        PublishedCatalogProduct result = new PublishedCatalogProductMapper().map(
                product, new ProductCategory(product.categoryId(), "degustation", "Dégustation", true, 0));

        assertEquals(1, result.purchaseModes().size());
        assertEquals("choice_allocation", result.purchaseModes().getFirst().get("allocation_type"));
        assertEquals(bomId.toString(),
                ((java.util.Map<?, ?>) ((List<?>) result.choiceGroup().get("options")).getFirst()).get("bom_id"));
    }
}
