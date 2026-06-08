package com.savouretplus.savis.catalog.domain;

import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class ProductBomTest {

    @Test
    void requiresBomPositiveQuantityAndNonNegativeDisplayOrder() {
        UUID bomId = UUID.randomUUID();

        assertThrows(IllegalArgumentException.class,
                () -> new ProductBom(null, null, BigDecimal.ONE, 0));
        assertThrows(IllegalArgumentException.class,
                () -> new ProductBom(null, bomId, BigDecimal.ZERO, 0));
        assertThrows(IllegalArgumentException.class,
                () -> new ProductBom(null, bomId, BigDecimal.ONE, -1));
    }
}
