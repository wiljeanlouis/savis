package com.savouretplus.savis.recipe.domain.model;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class QuantityTest {
    @Test
    void testConstructor_ShouldCreateQuantity() {
        Quantity quantity = new Quantity(1.5, Unit.KILOGRAMS);

        Assertions.assertEquals(quantity.value(), 1.5, "Quantity value should be 1.5");
        Assertions.assertEquals(quantity.unit(), Unit.KILOGRAMS, "Quantity unit should be KILOGRAMS");
    }

    @Test
    void testConstructor_ShouldThrowExceptionForNegativeValue() {
        Assertions.assertThrows(IllegalArgumentException.class, () -> new Quantity(-1.0, Unit.LITERS));
    }
}
