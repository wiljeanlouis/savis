package com.savouretplus.savis.supply.adapter.persistence;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.supply.domain.OfferStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Entity(name = "offers")
public class OfferEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private UUID publicId;

    @Column(nullable = false)
    private String externalId;

    private String url;

    @Column(nullable = false)
    private String componentName;

    private String brand;

    private String label;

    private String imageUrl;

    private BigDecimal priceAmount;

    private String priceCurrency;

    private Double packageSizeValue;

    private String packageSizeUnit;

    @Embedded
    private ProviderEntity provider;

    private LocalDateTime lastSeen;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OfferStatus status;
}
