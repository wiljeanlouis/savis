package com.savouretplus.savis.bom.adapter.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.savouretplus.savis.bom.domain.ActivityType;

/**
 * Spring Data repository for activity rate entities.
 */
interface ActivityRateJpaRepository extends JpaRepository<ActivityRateEntity, Long> {

    /**
     * Finds an activity rate by activity type.
     */
    Optional<ActivityRateEntity> findByActivityType(ActivityType activityType);

    /**
     * Deletes an activity rate by activity type.
     */
    void deleteByActivityType(ActivityType activityType);
}
