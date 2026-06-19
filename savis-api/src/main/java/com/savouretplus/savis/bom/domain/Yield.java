package com.savouretplus.savis.bom.domain;

import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;

/**
 * Represents the output quantity produced by a BOM.
 */
public record Yield(
        Quantity quantity,
        Unit unit) {

    /**
     * Validates the quantity produced by a BOM.
     */
    public Yield {
        if (quantity == null) {
            quantity = new Quantity(0, Unit.PIECE);
        }
        unit = unit != null ? unit : quantity.unit();
        if (quantity.unit() != unit) {
            quantity = new Quantity(quantity.value(), unit);
        }
    }
}
