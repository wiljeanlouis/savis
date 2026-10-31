package com.savouretplus.savis.catalog.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.savouretplus.savis.common.Money;

class CatalogCommercialPriceTest {

    @Test
    void convertsCatalogPricesUsingTheExplicitHalfUpRule() {
        assertEquals(1299, CatalogCommercialPrice.toCents(money("12.990", "CAD")));
        assertEquals(1300, CatalogCommercialPrice.toCents(money("12.995", "CAD")));
    }

    @Test
    void rejectsNegativeNonCadAndOverflowingPrices() {
        assertThrows(IllegalArgumentException.class,
                () -> CatalogCommercialPrice.toCents(money("-0.01", "CAD")));
        assertThrows(IllegalArgumentException.class,
                () -> CatalogCommercialPrice.toCents(money("12.99", "USD")));
        assertThrows(ArithmeticException.class,
                () -> CatalogCommercialPrice.toCents(money("21474836.48", "CAD")));
    }

    private Money money(String amount, String currency) {
        return new Money(new BigDecimal(amount), currency);
    }
}
