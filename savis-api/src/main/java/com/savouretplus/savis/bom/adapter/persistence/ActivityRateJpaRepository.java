package com.savouretplus.savis.bom.adapter.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.savouretplus.savis.bom.domain.ActivityType;

interface ActivityRateJpaRepository extends JpaRepository<ActivityRateEntity, Long> {

    Optional<ActivityRateEntity> findByActivityType(ActivityType activityType);

    void deleteByActivityType(ActivityType activityType);
}
