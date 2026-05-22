package com.savouretplus.savis.bom.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import com.savouretplus.savis.bom.domain.Activity;
import com.savouretplus.savis.bom.domain.Bom;
import com.savouretplus.savis.bom.domain.BomComponent;
import com.savouretplus.savis.bom.domain.Minute;
import com.savouretplus.savis.bom.domain.Yield;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.bom.port.BomRepositoryPort;

import lombok.AllArgsConstructor;

@Repository
@AllArgsConstructor
public class BomRepositoryAdapter implements BomRepositoryPort {

    private static final String BOM_FIND_ERROR = "BOM_FIND_ERROR";
    private static final String BOM_SAVE_ERROR = "BOM_SAVE_ERROR";
    private static final String BOM_DELETE_ERROR = "BOM_DELETE_ERROR";
    private static final String BOM_FIND_ALL_ERROR = "BOM_FIND_ALL_ERROR";

    private final BomJpaRepository jpaRepository;

    @Override
    public Optional<Bom> findByPublicId(UUID publicId) {
        try {
            return jpaRepository.findByPublicId(publicId)
                    .map(this::toDomain);
        } catch (Exception e) {
            throw new BomPersistenceException(BOM_FIND_ERROR, e.getCause());
        }

    }

    @Override
    public void save(Bom bom) {
        try {
            BomEntity entity = toEntity(bom);
            jpaRepository.save(entity);
        } catch (Exception e) {
            throw new BomPersistenceException(BOM_SAVE_ERROR, e.getCause());
        }
    }

    @Override
    public void delete(Bom bom) {
        try {
            BomEntity entity = toEntity(bom);
            jpaRepository.deleteById(entity.getId());
        } catch (Exception e) {
            throw new BomPersistenceException(BOM_DELETE_ERROR, e.getCause());
        }
    }

    @Override
    public List<Bom> findAll() {
        try {
            return jpaRepository.findAll(Sort.by("id").ascending())
                    .stream()
                    .map(this::toDomain)
                    .toList();
        } catch (Exception e) {
            throw new BomPersistenceException(BOM_FIND_ALL_ERROR, e.getCause());
        }
    }

    private Bom toDomain(BomEntity entity) {
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
                toComponents(entity.getComponents()),
                toActivities(entity.getActivities()),
                toYield(entity.getBomYield()));
    }

    private BomEntity toEntity(Bom bom) {
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
        entity.setComponents(toComponentEntities(bom.getComponents()));
        entity.setActivities(toActivityEntities(bom.getActivities()));
        entity.setBomYield(toYieldEntity(bom.getYield()));
        return entity;
    }

    private List<BomComponent> toComponents(List<BomComponentEntity> entities) {
        if (entities == null) {
            return List.of();
        }

        return entities.stream()
                .map(this::toDomain)
                .toList();
    }

    private List<BomComponentEntity> toComponentEntities(List<BomComponent> components) {
        if (components == null) {
            return List.of();
        }

        return components.stream()
                .map(this::toEntity)
                .toList();
    }

    private BomComponent toDomain(BomComponentEntity entity) {
        if (entity == null) {
            return null;
        }

        Unit unit = Unit.fromSymbole(entity.getUnit());
        return new BomComponent(
                entity.getId(),
                entity.getComponentName(),
                new Quantity(entity.getQuantity(), unit),
                entity.getSelectedOfferId());
    }

    private BomComponentEntity toEntity(BomComponent component) {
        if (component == null) {
            return null;
        }

        BomComponentEntity entity = new BomComponentEntity();
        entity.setId(component.id());
        entity.setComponentName(component.componentName());
        entity.setQuantity(component.quantity().value());
        entity.setUnit(component.quantity().unit().getSymbole());
        entity.setSelectedOfferId(component.selectedOfferId());
        return entity;
    }

    private List<Activity> toActivities(List<ActivityEntity> entities) {
        if (entities == null) {
            return List.of();
        }

        return entities.stream()
                .map(this::toDomain)
                .toList();
    }

    private List<ActivityEntity> toActivityEntities(List<Activity> activities) {
        if (activities == null) {
            return List.of();
        }

        return activities.stream()
                .map(this::toEntity)
                .toList();
    }

    private Activity toDomain(ActivityEntity entity) {
        if (entity == null) {
            return null;
        }

        return new Activity(
                entity.getId(),
                entity.getType(),
                Minute.of(entity.getMinutes()),
                entity.getSequence());
    }

    private ActivityEntity toEntity(Activity activity) {
        if (activity == null) {
            return null;
        }

        ActivityEntity entity = new ActivityEntity();
        entity.setId(activity.id());
        entity.setType(activity.type());
        entity.setMinutes(activity.minutes().value());
        entity.setSequence(activity.sequence());
        return entity;
    }

    private Yield toYield(YieldEntity entity) {
        if (entity == null) {
            return null;
        }

        return new Yield(new Quantity(entity.getQuantity(), Unit.fromSymbole(entity.getUnit())), Unit.fromSymbole(entity.getUnit()));
    }

    private YieldEntity toYieldEntity(Yield yield) {
        if (yield == null) {
            return null;
        }

        YieldEntity entity = new YieldEntity();
        entity.setQuantity(yield.quantity().value());
        entity.setUnit(yield.unit().getSymbole());
        return entity;
    }

}
