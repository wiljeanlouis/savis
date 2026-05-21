package com.savouretplus.savis.bom.adapter.persistence;

import java.math.BigDecimal;

import com.savouretplus.savis.bom.domain.ActivityType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Entity(name = "bom_activities")
@Table(name = "bom_activities")
public class ActivityEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityType type;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer minutes;

    @Column(name = "hourly_rate_amount", nullable = true)
    private BigDecimal hourlyRateAmount;

    @Column(name = "hourly_rate_currency", nullable = true)
    private String hourlyRateCurrency;

    @Column(nullable = false)
    private Integer sequence;
}
