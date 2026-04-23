package com.savouretplus.savis.recipe.infrastructure.persistence.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.savouretplus.savis.recipe.domain.model.IngredientRequirement;
import com.savouretplus.savis.recipe.domain.model.Quantity;
import com.savouretplus.savis.recipe.domain.model.Unit;
import com.savouretplus.savis.recipe.infrastructure.persistence.entity.IngredientRequirementEntity;

@Mapper(componentModel = "spring")
public interface IngredientRequirementMapper {

    @Mapping(source = "entity", target = "quantity", qualifiedByName = "toQuantity")
    IngredientRequirement toDomain(IngredientRequirementEntity entity);

    @Mapping(source = "requirement.quantity.value", target = "quantity")
    @Mapping(source = "requirement.quantity.unit", target = "unit")
    IngredientRequirementEntity fromDomain(IngredientRequirement requirement);

    @Named("toQuantity")
    default Quantity toQuantity(IngredientRequirementEntity entity) {
        if (entity == null) {
            return null;
        }
        Unit unit = Unit.valueOf(entity.getUnit());
        return new Quantity(entity.getQuantity(), unit);
    }
}

