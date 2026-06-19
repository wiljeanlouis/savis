package com.savouretplus.savis.bom.adapter.web;

import com.savouretplus.savis.bom.domain.ActivityRate;
import com.savouretplus.savis.bom.domain.ActivityType;
import com.savouretplus.savis.common.Money;

import jakarta.validation.constraints.NotNull;

/**
 * DTO used to exchange activity rate data over the web API.
 */
public record ActivityRateDto(
        Long id,
        /**
         * Creates a DTO or API value from the provided domain object.
         */
        @NotNull ActivityType activityType,
        @NotNull Money hourlyRate) {

    public static ActivityRateDto from(ActivityRate activityRate) {
        return new ActivityRateDto(
                activityRate.id(),
                activityRate.activityType(),
                activityRate.hourlyRate());
    }
}
