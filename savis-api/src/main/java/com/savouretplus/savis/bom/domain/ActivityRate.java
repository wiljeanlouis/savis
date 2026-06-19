package com.savouretplus.savis.bom.domain;

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
    }
}
