package com.savouretplus.savis.recipe.domain.model;

public record Quantity(double value, Unit unit) {
    public Quantity {
        if (value < 0) throw new IllegalArgumentException("Quantity cannot be negative");
    }
}
