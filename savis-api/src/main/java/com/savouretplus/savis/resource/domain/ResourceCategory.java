package com.savouretplus.savis.resource.domain;

public enum ResourceCategory {
    INGREDIENT, CONSUMABLE, PACKAGING, EQUIPMENT, DECORATION_MATERIAL;

    public boolean requiresReferenceUnit() {
        return this == INGREDIENT || this == CONSUMABLE || this == PACKAGING;
    }
}
