package com.savouretplus.savis.common;

import java.math.BigDecimal;

public record Quantity(double value, Unit unit) {
    public Quantity {
        if (value < 0)
            throw new IllegalArgumentException("Quantity cannot be negative");
    }

    public boolean isCompatibleWith(Quantity other) {
        return unit.baseUnit().equals(other.unit().baseUnit());
    }

    public BigDecimal baseValue() {
        return BigDecimal.valueOf(value).multiply(unit.baseUnitFactor());
    }
}
