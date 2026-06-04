package com.savouretplus.savis.bom.adapter.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import com.savouretplus.savis.bom.domain.ActivityRate;
import com.savouretplus.savis.bom.domain.ActivityType;
import com.savouretplus.savis.bom.port.ActivityRateRepositoryPort;
import com.savouretplus.savis.common.Money;

import lombok.AllArgsConstructor;

@Repository
@AllArgsConstructor
public class ActivityRateRepositoryAdapter implements ActivityRateRepositoryPort {

    private final ActivityRateJpaRepository jpaRepository;

    @Override
    public Optional<ActivityRate> findByActivityType(ActivityType activityType) {
        return jpaRepository.findByActivityType(activityType)
                .map(this::toDomain);
    }

    @Override
    public ActivityRate save(ActivityRate activityRate) {
        ActivityRateEntity entity = jpaRepository.findByActivityType(activityRate.activityType())
                .orElseGet(ActivityRateEntity::new);

        entity.setActivityType(activityRate.activityType());
        entity.setHourlyRateAmount(activityRate.hourlyRate().amount());
        entity.setHourlyRateCurrency(activityRate.hourlyRate().currency());

        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public void deleteByActivityType(ActivityType activityType) {
        jpaRepository.deleteByActivityType(activityType);
    }

    @Override
    public List<ActivityRate> findAll() {
        return jpaRepository.findAll(Sort.by("activityType").ascending())
                .stream()
                .map(this::toDomain)
                .toList();
    }

    private ActivityRate toDomain(ActivityRateEntity entity) {
        return new ActivityRate(
                entity.getId(),
                entity.getActivityType(),
                new Money(entity.getHourlyRateAmount(), entity.getHourlyRateCurrency()));
    }
}
