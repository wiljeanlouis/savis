package com.savouretplus.savis.bom.adapter.persistence;

import java.util.ArrayList;
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

/**
 * Persists BOM aggregates through Spring Data JPA entities.
 */
@Repository
@AllArgsConstructor
public class BomRepositoryAdapter implements BomRepositoryPort {

    private static final String BOM_FIND_ERROR = "BOM_FIND_ERROR";
    private static final String BOM_SAVE_ERROR = "BOM_SAVE_ERROR";
    private static final String BOM_DELETE_ERROR = "BOM_DELETE_ERROR";
    private static final String BOM_FIND_ALL_ERROR = "BOM_FIND_ALL_ERROR";

    private final BomJpaRepository jpaRepository;

    /**
     * Finds an aggregate by its public identifier.
     */
    @Override
    public Optional<Bom> findByPublicId(UUID publicId) {
        try {
            return jpaRepository.findByPublicId(publicId)
                    .map(this::toDomain);
        } catch (Exception e) {
            throw new BomPersistenceException(BOM_FIND_ERROR, e.getCause());
        }

    }

    /**
     * Persists the provided aggregate.
     */
    @Override
    public void save(Bom bom) {
        try {
            BomEntity entity = toEntity(bom);
            jpaRepository.save(entity);
        } catch (Exception e) {
            throw new BomPersistenceException(BOM_SAVE_ERROR, e.getCause());
        }
    }

    /**
     * Deletes the provided aggregate.
     */
    @Override
    public void delete(Bom bom) {
        try {
            jpaRepository.findByPublicId(bom.getPublicId())
                    .ifPresent(entity -> jpaRepository.deleteById(entity.getId()));
        } catch (Exception e) {
            throw new BomPersistenceException(BOM_DELETE_ERROR, e.getCause());
        }
    }

    /**
     * Returns all persisted aggregates.
     */
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

    /*
     * to domain mapper
     */

    private Bom toDomain(BomEntity entity) {
        if (entity == null) {
            return null;
        }

        return new Bom(
                entity.getPublicId(),
                entity.getName(),
                entity.getDescription(),
                entity.getImageUrl(),
                entity.getInstructions(),
                entity.getType(),
                toComponents(entity.getComponents()),
                toActivities(entity.getActivities()),
                toYield(entity.getBomYield()));
    }

    private List<BomComponent> toComponents(List<BomComponentEntity> entities) {
        if (entities == null) {
            return List.of();
        }

        return entities.stream()
                .map(this::toDomain)
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

    private List<Activity> toActivities(List<ActivityEntity> entities) {
        if (entities == null) {
            return List.of();
        }

        return entities.stream()
                .map(this::toDomain)
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

    private Yield toYield(YieldEntity entity) {
        if (entity == null) {
            return null;
        }

        return new Yield(new Quantity(entity.getQuantity(), Unit.fromSymbole(entity.getUnit())),
                Unit.fromSymbole(entity.getUnit()));
    }

    /*
     * to entity mapper
     */

    private BomEntity toEntity(Bom bom) {
        if (bom == null) {
            return null;
        }

        BomEntity entity = jpaRepository.findByPublicId(bom.getPublicId())
                .orElseGet(BomEntity::new);

        entity.setPublicId(bom.getPublicId());
        entity.setName(bom.getName());
        entity.setDescription(bom.getDescription());
        entity.setImageUrl(bom.getImageUrl());
        entity.setInstructions(bom.getInstructions());
        entity.setType(bom.getType());
        replaceComponents(entity, toComponentEntities(bom.getComponents()));
        replaceActivities(entity, toActivityEntities(bom.getActivities()));
        entity.setBomYield(toYieldEntity(bom.getYield()));
        return entity;
    }

    private void replaceComponents(BomEntity entity, List<BomComponentEntity> components) {
        if (entity.getComponents() == null) {
            entity.setComponents(components);
            return;
        }

        entity.getComponents().clear();
        entity.getComponents().addAll(components);
    }

    private List<BomComponentEntity> toComponentEntities(List<BomComponent> components) {
        if (components == null) {
            return List.of();
        }

        return components.stream()
                .map(this::toEntity)
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
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

    private void replaceActivities(BomEntity entity, List<ActivityEntity> activities) {
        if (entity.getActivities() == null) {
            entity.setActivities(activities);
            return;
        }

        entity.getActivities().clear();
        entity.getActivities().addAll(activities);
    }

    private List<ActivityEntity> toActivityEntities(List<Activity> activities) {
        if (activities == null) {
            return List.of();
        }

        return activities.stream()
                .map(this::toEntity)
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
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
