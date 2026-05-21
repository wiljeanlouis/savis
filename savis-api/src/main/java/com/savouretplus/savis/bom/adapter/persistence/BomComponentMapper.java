package com.savouretplus.savis.bom.adapter.persistence;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.bom.domain.BomComponent;

@Mapper(componentModel = "spring")
public interface BomComponentMapper {

    @Mapping(source = "entity", target = "quantity", qualifiedByName = "toQuantity")
    BomComponent toDomain(BomComponentEntity entity);

    @Mapping(source = "component.quantity.value", target = "quantity")
    @Mapping(source = "component.quantity.unit", target = "unit")
    BomComponentEntity fromDomain(BomComponent component);

    @Named("toQuantity")
    default Quantity toQuantity(BomComponentEntity entity) {
        if (entity == null) {
            return null;
        }
        Unit unit = Unit.valueOf(entity.getUnit());
        return new Quantity(entity.getQuantity(), unit);
    }
}
