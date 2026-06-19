package com.savouretplus.savis.bom.adapter.persistence;

import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.bom.domain.BomType;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * JPA entity storing a bill of materials and its owned child rows.
 */
@Getter
@Setter
@ToString
@Entity(name = "boms")
public class BomEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private UUID publicId;

    @Column(unique = true, nullable = false)
    private String name;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String imageUrl;

    @Column(nullable = true)
    private String instructions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private BomType type;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "bom_id", nullable = false)
    private List<BomComponentEntity> components;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "bom_id", nullable = false)
    private List<ActivityEntity> activities;

    @Embedded
    private YieldEntity bomYield;

}
