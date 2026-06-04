package com.savouretplus.savis.bom.port;

import java.util.List;
import java.util.Optional;

import com.savouretplus.savis.bom.domain.ActivityRate;
import com.savouretplus.savis.bom.domain.ActivityType;

public interface ActivityRateRepositoryPort {

    Optional<ActivityRate> findByActivityType(ActivityType activityType);

    ActivityRate save(ActivityRate activityRate);

    void deleteByActivityType(ActivityType activityType);

    List<ActivityRate> findAll();
}
