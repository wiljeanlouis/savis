package com.savouretplus.savis.sales.quotation.adapter.persistence;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.savouretplus.savis.sales.quotation.domain.QuotationItem;
import com.savouretplus.savis.sales.quotation.domain.QuotationStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

/** JPA representation of a quotation and its immutable JSON item snapshots. */
@Getter
@Setter
@Entity
@Table(name = "quotations")
class QuotationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Version
    private long version;
    @Column(nullable = false, unique = true)
    private UUID publicId;
    @Column(nullable = false, unique = true)
    private String quotationNumber;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuotationStatus status;
    @Column(nullable = false)
    private String customerName;
    @Column(nullable = false)
    private String customerPhone;
    private String customerEmail;
    private String customerAddressLine1;
    private String customerAddressLine2;
    private String customerCity;
    private String customerProvince;
    private String customerPostalCode;
    @Column(nullable = false)
    private LocalDate validUntil;
    @Column(columnDefinition = "text")
    private String note;
    @Column(nullable = false)
    private int discountCents;
    @Column(nullable = false)
    private int deliveryFeeCents;
    @Column(nullable = false)
    private int totalCents;
    @Column(nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;
    private Instant sentAt;
    private Instant acceptedAt;
    private Instant rejectedAt;
    @Column(unique = true)
    private UUID convertedOrderId;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<QuotationItem> items = new ArrayList<>();
}
