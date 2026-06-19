package com.savouretplus.savis.bom.adapter.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * Embeddable JPA value storing the yield quantity for a BOM.
 */
@Getter
@Setter
@ToString
@Embeddable
public class YieldEntity {
    @Column(nullable = false)
    private double quantity;

    @Column(nullable = false)
    private String unit;
}
