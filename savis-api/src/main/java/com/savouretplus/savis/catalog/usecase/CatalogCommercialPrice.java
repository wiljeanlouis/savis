package com.savouretplus.savis.catalog.usecase;

import java.math.RoundingMode;

import com.savouretplus.savis.common.Money;

/** Converts one CAD catalog sale price to the commercial cents contract. */
final class CatalogCommercialPrice {
    private static final String COMMERCIAL_CURRENCY = "CAD";

    private CatalogCommercialPrice() {
    }

    /** Returns non-negative CAD cents with the Catalog commercial rounding rule. */
    static int toCents(Money money) {
        if (money == null) {
            throw new IllegalArgumentException("Le prix commercial est requis");
        }
        if (!COMMERCIAL_CURRENCY.equals(money.currency())) {
            throw new IllegalArgumentException(
                    "Les prix commerciaux SAVIS doivent être en CAD, pas en " + money.currency());
        }
        if (money.amount().signum() < 0) {
            throw new IllegalArgumentException("Le prix commercial ne peut pas être négatif");
        }
        return money.amount()
                .movePointRight(2)
                .setScale(0, RoundingMode.HALF_UP)
                .intValueExact();
    }
}
