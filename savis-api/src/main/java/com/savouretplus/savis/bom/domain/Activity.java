package com.savouretplus.savis.bom.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;

import com.savouretplus.savis.common.Money;

public record Activity(
        Long id,
        ActivityType type,
        Minute minutes,
        Integer sequence) {

    public Activity {
        type = type != null ? type : ActivityType.CUSTOM;
        minutes = minutes != null ? minutes : Minute.of(0);
        sequence = sequence != null ? sequence : 0;
    }

    public Money calculateCost(Money hourlyRate) {
        if (hourlyRate == null) {
            return Money.ZERO;
        }

        BigDecimal hours = BigDecimal.valueOf(minutes.value())
                .divide(BigDecimal.valueOf(60), 10, RoundingMode.HALF_UP);

        return hourlyRate.multiply(hours);
    }
}
