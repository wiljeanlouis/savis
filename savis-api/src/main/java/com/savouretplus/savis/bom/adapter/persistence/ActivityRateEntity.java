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
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * JPA entity storing the hourly rate for an activity type.
 */
@Getter
@Setter
@ToString
@Entity(name = "activity_rates")
public class ActivityRateEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(unique = true, nullable = false)
    private ActivityType activityType;

    @Column(nullable = false)
    private BigDecimal hourlyRateAmount;

    @Column(nullable = false)
    private String hourlyRateCurrency;
}
