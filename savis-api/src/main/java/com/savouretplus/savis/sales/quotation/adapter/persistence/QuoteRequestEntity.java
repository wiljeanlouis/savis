package com.savouretplus.savis.sales.quotation.adapter.persistence;

import java.time.Instant;
import java.util.UUID;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "quote_requests", uniqueConstraints = @UniqueConstraint(columnNames = {"source", "external_id"}))
@Getter @Setter
class QuoteRequestEntity {
    @Version private long version;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private com.savouretplus.savis.sales.quotation.domain.QuoteRequestStatus status;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition="jsonb") private com.savouretplus.savis.sales.quotation.domain.QuoteRequestQualification qualification;
    @Column(columnDefinition="text") private String closedReason;
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable=false,columnDefinition="jsonb") private java.util.List<com.savouretplus.savis.sales.quotation.domain.QuoteRequest.Change> history = new java.util.ArrayList<>();
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable=false,columnDefinition="jsonb") private java.util.Set<String> needKeys = new java.util.HashSet<>();

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, unique=true) private UUID publicId;
    @Column(nullable=false, updatable=false) private String source;
    @Column(nullable=false, updatable=false) private UUID externalId;
    @Column(updatable=false) private UUID submissionRequestId;
    @Column(nullable=false, updatable=false, length=64) private String fingerprint;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable=false, updatable=false, columnDefinition="jsonb") private String originalPayload;
    @Column(nullable=false) private String customerName;
    @Column(nullable=false) private String customerPhone;
    private String customerEmail;
    @Column(nullable=false, updatable=false) private Instant receivedAt;
    @Column(nullable=false, updatable=false) private Instant importedAt;
}
