package com.savouretplus.savis.bom.domain;

import com.savouretplus.savis.common.Money;

public record ActivityRate(
        Long id,
        ActivityType activityType,
        Money hourlyRate) {

    public ActivityRate {
        if (activityType == null) {
            throw new IllegalArgumentException("Activity type is required");
        }

        if (hourlyRate == null) {
            throw new IllegalArgumentException("Hourly rate is required");
        }
    }
}
