package com.savouretplus.savis.bom.usecase;

import java.util.List;

import org.springframework.stereotype.Service;

import com.savouretplus.savis.bom.domain.ActivityRate;
import com.savouretplus.savis.bom.domain.ActivityType;
import com.savouretplus.savis.bom.port.ActivityRateRepositoryPort;
import com.savouretplus.savis.common.Money;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
@AllArgsConstructor
public class ActivityRateService {

    private final ActivityRateRepositoryPort repository;

    public ActivityRate createActivityRate(ActivityType activityType, Money hourlyRate) {
        log.info("Create activity rate for {}", activityType);

        repository.findByActivityType(activityType)
                .ifPresent(activityRate -> {
                    throw new IllegalStateException("Activity rate already exists");
                });

        return repository.save(new ActivityRate(null, activityType, hourlyRate));
    }

    public ActivityRate updateActivityRate(ActivityType activityType, Money hourlyRate) {
        log.info("Update activity rate for {}", activityType);

        ActivityRate existingRate = getActivityRate(activityType);

        return repository.save(new ActivityRate(existingRate.id(), activityType, hourlyRate));
    }

    public ActivityRate getActivityRate(ActivityType activityType) {
        return repository.findByActivityType(activityType)
                .orElseThrow(() -> new RuntimeException("Activity rate not found"));
    }

    public List<ActivityRate> listActivityRates() {
        return repository.findAll();
    }

    public void deleteActivityRate(ActivityType activityType) {
        getActivityRate(activityType);
        repository.deleteByActivityType(activityType);
    }
}
