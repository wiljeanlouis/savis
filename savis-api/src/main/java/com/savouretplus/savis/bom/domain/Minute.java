package com.savouretplus.savis.bom.domain;

/**
 * Represents a positive duration expressed in whole minutes.
 */
public record Minute(
        Integer value) {

    /**
     * Validates a strictly positive minute value.
     */
    public Minute {
        if (value != null && value < 0) {
            throw new IllegalArgumentException("Minutes cannot be negative");
        }

        if (value == null) {
            value = 0;
        }

        value = Math.max(0, value);
    }

    /**
     * Creates a new value object from the provided input.
     */
    public static Minute of(Integer i) {
        /**
         * Creates a minute instance.
         */
        return new Minute(i == null ? 0 : i);
    }
}
