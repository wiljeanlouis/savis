package com.savouretplus.savis.catalog.domain;

import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.savouretplus.savis.common.Money;

class ProductTest {

    @Test
    void requiresAtLeastOneActivePurchaseMode() {
        assertThrows(IllegalArgumentException.class,
                () -> product(List.of()));
        assertThrows(IllegalArgumentException.class,
                () -> product(List.of(new ProductPurchaseMode(
                        null, "unit", "À l'unité", 1, Money.of(5), AllocationType.NONE, false, 0))));
    }

    private Product product(List<ProductPurchaseMode> purchaseModes) {
        return new Product(
                null, "pate", "pate", "Pâté", "", ProductType.STANDARD, ProductCategory.TASTING,
                List.of(), new BigDecimal("0.30"), "/pate.jpg", List.of(), "Disponible",
                true, false, 0, purchaseModes, null, List.of());
    }
}
