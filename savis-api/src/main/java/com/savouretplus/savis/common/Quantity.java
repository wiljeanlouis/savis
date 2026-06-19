package com.savouretplus.savis.common;

import java.math.BigDecimal;

/**
 * Represents a measured quantity and the unit used to express it.
 */
public record Quantity(double value, Unit unit) {
    /**
     * Validates a measured quantity.
     */
    public Quantity {
        if (value < 0)
            throw new IllegalArgumentException("Quantity cannot be negative");
    }

    /**
     * Checks whether another quantity can be converted to the same base unit.
     */
    public boolean isCompatibleWith(Quantity other) {
        return unit.baseUnit().equals(other.unit().baseUnit());
    }

    /**
     * Converts the quantity to its base-unit value.
     */
    public BigDecimal baseValue() {
        return BigDecimal.valueOf(value).multiply(unit.baseUnitFactor());
    }
}
