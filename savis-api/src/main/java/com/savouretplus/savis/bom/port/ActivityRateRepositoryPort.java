package com.savouretplus.savis.bom.port;

import java.util.List;
import java.util.Optional;

import com.savouretplus.savis.bom.domain.ActivityRate;
import com.savouretplus.savis.bom.domain.ActivityType;

/**
 * Defines persistence operations for activity rate configuration.
 */
public interface ActivityRateRepositoryPort {

    /**
     * Finds an activity rate by activity type.
     */
    Optional<ActivityRate> findByActivityType(ActivityType activityType);

    /**
     * Persists the provided aggregate.
     */
    ActivityRate save(ActivityRate activityRate);

    /**
     * Deletes an activity rate by activity type.
     */
    void deleteByActivityType(ActivityType activityType);

    /**
     * Returns all persisted aggregates.
     */
    List<ActivityRate> findAll();
}
