package com.savouretplus.savis.bom.domain;

import com.savouretplus.savis.common.Money;

public record Activity(
        Long id,
        ActivityType type,
        String name,
        Minute minutes,
        Money hourlyRate,
        Integer sequence) {

    public Activity {
        type = type != null ? type : ActivityType.CUSTOM;
        minutes = minutes != null ? minutes : Minute.of(0);
        sequence = sequence != null ? sequence : 0;
    }
}
