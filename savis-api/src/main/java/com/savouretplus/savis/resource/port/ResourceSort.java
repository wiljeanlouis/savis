package com.savouretplus.savis.resource.port;

/** Ordering of the complete resource catalog before pagination. */
public enum ResourceSort {
    NAME_ASC(Field.NAME, false), NAME_DESC(Field.NAME, true),
    CATEGORY_ASC(Field.CATEGORY, false), CATEGORY_DESC(Field.CATEGORY, true),
    UNIT_ASC(Field.UNIT, false), UNIT_DESC(Field.UNIT, true);

    public enum Field { NAME, CATEGORY, UNIT }
    private final Field field;
    private final boolean descending;

    ResourceSort(Field field, boolean descending) {
        this.field = field;
        this.descending = descending;
    }

    public Field field() { return field; }
    public boolean descending() { return descending; }
}
