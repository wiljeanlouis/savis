package com.savouretplus.savis.bom.domain;

import com.savouretplus.savis.common.ActivityType;

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
}
