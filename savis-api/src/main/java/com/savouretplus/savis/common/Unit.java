package com.savouretplus.savis.common;

import java.math.BigDecimal;

/**
 * Defines the supported measurement units and their conversion factors to base units.
 */
public enum Unit {
    GRAM("g", "g", "1"),
    KILOGRAM("kg", "g", "1000"),
    LITER("l", "ml", "1000"),
    MILLILITER("ml", "ml", "1"),
    PIECE("piece", "piece", "1"),
    PORTION("portion", "portion", "1");

    private final String symbole;
    private final String baseUnit;
    private final BigDecimal baseUnitFactor;

    private Unit(String symbole, String baseUnit, String baseUnitFactor){
        this.symbole = symbole;
        this.baseUnit = baseUnit;
        this.baseUnitFactor = new BigDecimal(baseUnitFactor);
    }

    /**
     * Returns the display symbol used for this unit.
     */
    public String getSymbole(){
        return this.symbole;
    }

    /**
     * Returns the canonical base unit for this unit.
     */
    public String baseUnit() {
        return baseUnit;
    }

    /**
     * Returns the conversion factor from this unit to its base unit.
     */
    public BigDecimal baseUnitFactor() {
        return baseUnitFactor;
    }

    /**
     * Resolves a unit from its display symbol.
     */
    public static Unit fromSymbole(String symbole){
       if (symbole == null || symbole.isBlank()) {
            throw new IllegalArgumentException("Unit symbole cannot be blank");
       }

       String normalizedCode = symbole.trim();
       for (Unit u : Unit.values()) {
            if(u.getSymbole().equalsIgnoreCase(normalizedCode) || u.name().equalsIgnoreCase(normalizedCode)){
                return u;
            }
       }
       throw new IllegalArgumentException("Unsupported unit: " + symbole);
    }

    /**
     * Returns the unit display symbol.
     */
    @Override
    public String toString() {
        return symbole;
    }
}
