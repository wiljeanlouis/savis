package com.savouretplus.savis.bom.domain;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.savouretplus.savis.common.Money;

class ActivityRateTest {

    @Test
    void acceptsZeroAndAmountsExactlyRepresentableToTheCent() {
        assertDoesNotThrow(() -> rate(new BigDecimal("0.00")));
        assertDoesNotThrow(() -> rate(new BigDecimal("12.990")));
    }

    @Test
    void rejectsFractionalCentsAndNegativeRates() {
        assertThrows(IllegalArgumentException.class, () -> rate(new BigDecimal("12.995")));
        assertThrows(IllegalArgumentException.class, () -> rate(new BigDecimal("-0.01")));
    }

    private ActivityRate rate(BigDecimal amount) {
        return new ActivityRate(null, ActivityType.PREP, new Money(amount, "CAD"));
    }
}
