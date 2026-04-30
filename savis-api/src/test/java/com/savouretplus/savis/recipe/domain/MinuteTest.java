package com.savouretplus.savis.recipe.domain;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import com.savouretplus.savis.recipe.domain.Minute;

public class MinuteTest {
    @Test
    void testOf_ShouldReturnMinuteInstance() {
        Minute minute = Minute.of(5);
        Assertions.assertEquals(minute.value(), 5, "Minute value should be 5");

    }

    @Test
    void testOf_ShouldThrowExceptionForNegativeValue() {
        Assertions.assertThrows(IllegalArgumentException.class, () -> Minute.of(-1));
    }

    @Test
    void testOf_ShouldDefaultToZeroForNullValue() {
        Minute minute = Minute.of(null);
        Assertions.assertEquals(minute.value(), 0, "Minute value should be 0");
    }
}
