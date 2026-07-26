package com.savouretplus.savis.catalog.domain;

/**
 * Optional product grouping associated with a parent catalog category.
 */
public enum ProductSubcategory {
    BALLOON_ARCH("balloon-arch", "Arche de ballon", ProductCategory.DECORATION),
    CENTERPIECE("centerpiece", "Centre de table", ProductCategory.DECORATION),
    BIRTHDAY("birthday", "Anniversaire", ProductCategory.DECORATION),
    WEDDING("wedding", "Mariage", ProductCategory.DECORATION);

    private final String code;
    private final String label;
    private final ProductCategory category;

    ProductSubcategory(String code, String label, ProductCategory category) {
        this.code = code;
        this.label = label;
        this.category = category;
    }

    public String code() {
        return code;
    }

    public String label() {
        return label;
    }

    public ProductCategory category() {
        return category;
    }
}
