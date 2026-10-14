package com.savouretplus.savis.catalog.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.savouretplus.savis.catalog.domain.AllocationType;
import com.savouretplus.savis.catalog.domain.CommercialType;
import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductCategory;
import com.savouretplus.savis.catalog.domain.ProductChoiceGroup;
import com.savouretplus.savis.catalog.domain.ProductChoiceOption;
import com.savouretplus.savis.catalog.domain.ProductType;
import com.savouretplus.savis.catalog.domain.ProductSubcategory;
import com.savouretplus.savis.catalog.port.PublishedCatalogProduct;
import com.savouretplus.savis.common.Money;

class PublishedCatalogProductMapperTest {

    @Test
    void publishesOnlyActiveCustomerFacingConfiguration() {
        UUID bomId = UUID.randomUUID();
        Product product = new Product(
                null, "pate-four", "pate-four", "Pâté au four", "",
                CommercialType.SERVICE, ProductType.SINGLE_CHOICE_BUNDLE,
                ProductCategory.DECORATION,
                ProductSubcategory.BALLOON_ARCH, List.of(),
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

        PublishedCatalogProduct result = new PublishedCatalogProductMapper().map(product);

        assertEquals(1, result.purchaseModes().size());
        assertEquals("decoration", result.category());
        assertEquals("service", result.commercialType());
        assertEquals("balloon-arch", result.subcategory());
        assertEquals("choice_allocation", result.purchaseModes().getFirst().get("allocation_type"));
        assertEquals(bomId.toString(),
                ((java.util.Map<?, ?>) ((List<?>) result.choiceGroup().get("options")).getFirst()).get("bom_id"));
    }

    @Test
    void rejectsANonCadPriceBeforeSupabasePublication() {
        Product product = new Product(
                null, "service", "service", "Service", "",
                CommercialType.SERVICE, ProductType.STANDARD, ProductCategory.DECORATION,
                null, List.of(), new BigDecimal("0.35"), "/service.jpg", List.of(),
                "Disponible", true, true, 1,
                List.of(new com.savouretplus.savis.catalog.domain.ProductPurchaseMode(
                        null, "service", "Service", 1,
                        new Money(new BigDecimal("30.00"), "USD"),
                        AllocationType.NONE, true, 0)),
                null, List.of());

        assertThrows(IllegalArgumentException.class,
                () -> new PublishedCatalogProductMapper().map(product));
    }
}
