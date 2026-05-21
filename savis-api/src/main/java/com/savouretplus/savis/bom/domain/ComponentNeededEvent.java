package com.savouretplus.savis.bom.domain;

public record ComponentNeededEvent(String componentNameKey, BomType type) {

    public static ComponentNeededEvent of(String componentNameKey, BomType type) {
        return new ComponentNeededEvent(componentNameKey, type != null ? type : BomType.FOOD);
    }

}
