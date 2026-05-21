package com.savouretplus.savis.bom.adapter.persistence;

import java.util.List;

import org.mapstruct.Mapper;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.bom.domain.Activity;
import com.savouretplus.savis.bom.domain.BomComponent;
import com.savouretplus.savis.bom.domain.Bom;
import com.savouretplus.savis.bom.domain.Minute;
import com.savouretplus.savis.bom.domain.Yield;

@Mapper(componentModel = "spring", uses = BomComponentMapper.class)
public interface BomMapper {

    default Bom toDomain(BomEntity entity) {
        if (entity == null) {
            return null;
        }
        return new Bom(
                entity.getPublicId(),
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getImageUrl(),
                entity.getInstructions(),
                entity.getType(),
                map(entity.getComponents()),
                mapActivities(entity.getActivities()),
                toDomain(entity.getBomYield()));
    }

    default BomEntity fromDomain(Bom bom) {
        if (bom == null) {
            return null;
        }
        BomEntity entity = new BomEntity();
        entity.setId(bom.getId());
        entity.setPublicId(bom.getPublicId());
        entity.setName(bom.getName());
        entity.setDescription(bom.getDescription());
        entity.setImageUrl(bom.getImageUrl());
        entity.setInstructions(bom.getInstructions());
        entity.setType(bom.getType());
        entity.setComponents(mapToEntities(bom.getComponents()));
        entity.setActivities(mapActivitiesToEntities(bom.getActivities()));
        entity.setBomYield(fromDomain(bom.getYield()));
        return entity;
    }

    List<BomComponent> map(List<BomComponentEntity> entities);

    List<BomComponentEntity> mapToEntities(List<BomComponent> components);

    default List<Activity> mapActivities(List<ActivityEntity> entities) {
        if (entities == null) {
            return List.of();
        }
        return entities.stream()
                .map(this::toDomain)
                .toList();
    }

    default List<ActivityEntity> mapActivitiesToEntities(List<Activity> activities) {
        if (activities == null) {
            return List.of();
        }
        return activities.stream()
                .map(this::fromDomain)
                .toList();
    }

    default Activity toDomain(ActivityEntity entity) {
        if (entity == null) {
            return null;
        }
        Money hourlyRate = entity.getHourlyRateAmount() != null
                ? new Money(entity.getHourlyRateAmount(), entity.getHourlyRateCurrency())
                : null;
        return new Activity(
                entity.getId(),
                entity.getType(),
                entity.getName(),
                Minute.of(entity.getMinutes()),
                hourlyRate,
                entity.getSequence());
    }

    default ActivityEntity fromDomain(Activity activity) {
        if (activity == null) {
            return null;
        }
        ActivityEntity entity = new ActivityEntity();
        entity.setId(activity.id());
        entity.setType(activity.type());
        entity.setName(activity.name());
        entity.setMinutes(activity.minutes().value());
        if (activity.hourlyRate() != null) {
            entity.setHourlyRateAmount(activity.hourlyRate().amount());
            entity.setHourlyRateCurrency(activity.hourlyRate().currency());
        }
        entity.setSequence(activity.sequence());
        return entity;
    }

    default Yield toDomain(YieldEntity entity) {
        if (entity == null) {
            return null;
        }
        return new Yield(new Quantity(entity.getQuantity(), entity.getUnit()), entity.getUnit());
    }

    default YieldEntity fromDomain(Yield yield) {
        if (yield == null) {
            return null;
        }
        YieldEntity entity = new YieldEntity();
        entity.setQuantity(yield.quantity().value());
        entity.setUnit(yield.unit());
        return entity;
    }
}
