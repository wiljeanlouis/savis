package com.savouretplus.savis.invoice.adapter.persistence;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.savouretplus.savis.invoice.domain.InvoiceItem;
import com.savouretplus.savis.invoice.domain.InvoiceStatus;

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

/** JPA representation of an invoice and its immutable JSON line snapshots. */
@Getter
@Setter
@Entity
@Table(name = "invoices")
class InvoiceEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Version
    private long version;
    @Column(nullable = false, unique = true)
    private UUID publicId;
    @Column(unique = true)
    private String invoiceNumber;
    @Column(nullable = false, unique = true)
    private UUID sourceOrderId;
    @Column(nullable = false)
    private String sourceOrderNumber;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status;
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
    @Column(columnDefinition = "text")
    private String note;
    @Column(nullable = false)
    private int subtotalCents;
    @Column(nullable = false)
    private int discountCents;
    @Column(nullable = false)
    private int deliveryFeeCents;
    @Column(nullable = false)
    private int gstCents;
    @Column(nullable = false)
    private int qstCents;
    @Column(nullable = false)
    private int totalCents;
    @Column(nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;
    private Instant issuedAt;
    private Instant cancelledAt;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<InvoiceItem> items = new ArrayList<>();
}
