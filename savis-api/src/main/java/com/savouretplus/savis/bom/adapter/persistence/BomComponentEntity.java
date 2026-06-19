package com.savouretplus.savis.bom.adapter.persistence;

import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * JPA entity storing one material component attached to a BOM.
 */
@Getter
@Setter
@ToString
@Entity(name = "bom_components")
public class BomComponentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String componentName;

    private double quantity;

    private String unit;

    private UUID selectedOfferId;
}
