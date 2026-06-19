package com.savouretplus.savis.bom.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;

import com.savouretplus.savis.common.Money;

/**
 * Represents a production activity that contributes labor cost to a BOM.
 */
public record Activity(
        Long id,
        ActivityType type,
        Minute minutes,
        Integer sequence) {

    /**
     * Validates a production activity and its ordering metadata.
     */
    public Activity {
        type = type != null ? type : ActivityType.CUSTOM;
        minutes = minutes != null ? minutes : Minute.of(0);
        sequence = sequence != null ? sequence : 0;
    }

    /**
     * Calculates the labor cost for this activity from an hourly rate.
     */
    public Money calculateCost(Money hourlyRate) {
        if (hourlyRate == null) {
            return Money.ZERO;
        }

        BigDecimal hours = BigDecimal.valueOf(minutes.value())
                .divide(BigDecimal.valueOf(60), 10, RoundingMode.HALF_UP);

        return hourlyRate.multiply(hours);
    }
}
