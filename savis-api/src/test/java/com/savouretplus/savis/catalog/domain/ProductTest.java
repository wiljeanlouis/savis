package com.savouretplus.savis.catalog.domain;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
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

    @Test
    void rejectsSubcategoryFromAnotherProductCategory() {
        assertThrows(IllegalArgumentException.class,
                () -> product(ProductCategory.TASTING, ProductSubcategory.DECORATIVE_ARCH,
                        List.of(new ProductPurchaseMode(
                                null, "unit", "À l'unité", 1, Money.of(5),
                                AllocationType.NONE, true, 0))));
    }

    @Test
    void commercialPricesMustBeExactlyRepresentableToTheCent() {
        assertDoesNotThrow(() -> new ProductPurchaseMode(
                null, "unit", "À l'unité", 1, new Money(new BigDecimal("12.990"), "CAD"),
                AllocationType.NONE, true, 0));
        assertThrows(IllegalArgumentException.class, () -> new ProductPurchaseMode(
                null, "unit", "À l'unité", 1, new Money(new BigDecimal("12.995"), "CAD"),
                AllocationType.NONE, true, 0));
        assertThrows(IllegalArgumentException.class, () -> new ProductIngredientOption(
                null, "extra", "Extra", null, 0, 0, 1,
                new Money(new BigDecimal("0.001"), "CAD"), true, 0));
    }

    private Product product(List<ProductPurchaseMode> purchaseModes) {
        return product(ProductCategory.TASTING, null, purchaseModes);
    }

    private Product product(
            ProductCategory category,
            ProductSubcategory subcategory,
            List<ProductPurchaseMode> purchaseModes) {
        return new Product(
                null, "pate", "pate", "Pâté", "", CommercialType.GOODS,
                ProductType.STANDARD, category,
                subcategory, List.of(), new BigDecimal("0.30"), "/pate.jpg", List.of(), "Disponible",
                true, false, 0, purchaseModes, null, List.of());
    }
}
