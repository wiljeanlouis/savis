package com.savouretplus.savis.recipe.adapter.persistence.ingredient;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.recipe.domain.ingredient.IngredientRequirement;

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
