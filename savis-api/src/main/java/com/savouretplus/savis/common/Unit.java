package com.savouretplus.savis.common;

public enum Unit {
    GRAM("g"), KILOGRAM("kg"), LITER("l"), MILLILITER("ml"), PIECE("piece"), PORTION("portion");

    private final String symbole;

    private Unit(String symbole){
        this.symbole = symbole;
    }

    public String getSymbole(){
        return this.symbole;
    }

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

    @Override
    public String toString() {
        return symbole;
    }
}
