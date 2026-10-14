package com.savouretplus.savis.common;

import java.math.BigDecimal;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class MoneyTest {

    @Test
    void testOf() {
        Money m = Money.of(10.00);
        Assertions.assertEquals(BigDecimal.valueOf(10.00), m.amount());
        Assertions.assertEquals("CAD", m.currency());
    }

    @Test
    void testAdd() {
        Money m1 = new Money(BigDecimal.valueOf(10.01), "CAD");
        Money m2 = new Money(BigDecimal.valueOf(5.04), "CAD");
        Money result = m1.add(m2);
        Assertions.assertEquals(new Money(BigDecimal.valueOf(15.05), "CAD"), result);

    }

    @Test
    void testMultiply() {
        Money m = new Money(BigDecimal.valueOf(10.00), "CAD");
        Money result = m.multiply(3);
        Assertions.assertEquals(new Money(BigDecimal.valueOf(30.00), "CAD"), result);
    }

    @Test
    void validatesAndNormalizesCurrencyCodes() {
        Assertions.assertEquals("CAD", new Money(BigDecimal.ONE, " cad ").currency());

        Assertions.assertThrows(IllegalArgumentException.class, () -> new Money(BigDecimal.ONE, null));
        Assertions.assertThrows(IllegalArgumentException.class, () -> new Money(BigDecimal.ONE, " "));
        Assertions.assertThrows(IllegalArgumentException.class, () -> new Money(BigDecimal.ONE, "INVALID"));
    }

    @Test
    void rejectsArithmeticBetweenDifferentCurrencies() {
        Money cad = new Money(BigDecimal.ONE, "CAD");
        Money usd = new Money(BigDecimal.ONE, "USD");

        Assertions.assertThrows(IllegalArgumentException.class, () -> cad.add(usd));
    }

}
