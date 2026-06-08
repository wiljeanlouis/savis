package com.savouretplus.savis.catalog.usecase;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductBom;
import com.savouretplus.savis.catalog.domain.ProductCategory;
import com.savouretplus.savis.catalog.domain.ProductType;
import com.savouretplus.savis.catalog.port.BomPricingPort;
import com.savouretplus.savis.catalog.port.ProductCategoryRepository;
import com.savouretplus.savis.catalog.port.ProductRepository;
import com.savouretplus.savis.common.Money;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {
    @Mock ProductRepository products;
    @Mock ProductCategoryRepository categories;
    @Mock BomPricingPort bomPricing;

    @Test
    void refusesUnknownProductBomOnCreate() {
        UUID categoryId = UUID.randomUUID();
        UUID bomId = UUID.randomUUID();
        Product product = new Product(
                null, "pate", "pate", "Pâté", "", ProductType.STANDARD,
                categoryId, List.of(new ProductBom(null, bomId, BigDecimal.ONE, 0)),
                Money.of(5), new BigDecimal("0.30"), "unité",
                "/pate.jpg", List.of(), "Disponible", true, true, 0,
                List.of(), null, List.of());
        when(categories.findByPublicId(categoryId))
                .thenReturn(Optional.of(new ProductCategory(categoryId, "food", "Food", true, 0)));
        when(bomPricing.exists(bomId)).thenReturn(false);

        assertThrows(IllegalArgumentException.class,
                () -> new ProductService(products, categories, bomPricing).create(product));
    }
}
