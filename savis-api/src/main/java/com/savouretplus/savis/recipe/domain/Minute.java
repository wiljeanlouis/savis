package com.savouretplus.savis.recipe.domain;

public record Minute(
        Integer value) {

    public Minute {
        if (value != null && value < 0) {
            throw new IllegalArgumentException("Minutes cannot be negative");
        }

        if (value == null) {
            value = 0;
        }

        value = Math.max(0, value);
    }

    public static Minute of(Integer i) {
        return new Minute(i == null ? 0 : i);
    }
}
