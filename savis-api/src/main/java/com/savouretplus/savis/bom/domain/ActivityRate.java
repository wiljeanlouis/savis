package com.savouretplus.savis.bom.domain;

import java.math.RoundingMode;

import com.savouretplus.savis.common.Money;

/**
 * Represents the hourly rate configured for a production activity type.
 */
public record ActivityRate(
        Long id,
        ActivityType activityType,
        Money hourlyRate) {

    /**
     * Validates the hourly rate configured for an activity type.
     */
    public ActivityRate {
        if (activityType == null) {
            throw new IllegalArgumentException("Activity type is required");
        }

        if (hourlyRate == null) {
            throw new IllegalArgumentException("Hourly rate is required");
        }
        if (hourlyRate.amount().signum() < 0) {
            throw new IllegalArgumentException("Hourly rate cannot be negative");
        }
        try {
            hourlyRate.amount().setScale(2, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException(
                    "Hourly rate must be exactly representable to the cent", exception);
        }
    }
}
