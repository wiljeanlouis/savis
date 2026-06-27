package com.savouretplus.savis.catalog.usecase;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductBom;
import com.savouretplus.savis.catalog.domain.ProductCategory;
import com.savouretplus.savis.catalog.domain.ProductPurchaseMode;
import com.savouretplus.savis.catalog.domain.ProductType;
import com.savouretplus.savis.catalog.domain.AllocationType;
import com.savouretplus.savis.catalog.port.BomPricingPort;
import com.savouretplus.savis.catalog.port.ProductRepository;
import com.savouretplus.savis.common.Money;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {
    @Mock ProductRepository products;
    @Mock BomPricingPort bomPricing;

    @Test
    void refusesUnknownProductBomOnCreate() {
        UUID bomId = UUID.randomUUID();
        Product product = new Product(
                null, "pate", "pate", "Pâté", "", ProductType.STANDARD,
                ProductCategory.TASTING, List.of(new ProductBom(null, bomId, BigDecimal.ONE, 0)),
                new BigDecimal("0.30"),
                "/pate.jpg", List.of(), "Disponible", true, true, 0,
                List.of(new ProductPurchaseMode(
                        null, "unit", "À l'unité", 1, Money.of(5), AllocationType.NONE, true, 0)),
                null, List.of());
        when(bomPricing.exists(bomId)).thenReturn(false);

        assertThrows(IllegalArgumentException.class,
                () -> new ProductService(products, bomPricing).create(product));
    }
}
