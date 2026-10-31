package com.savouretplus.savis.sales.order.adapter.persistence;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.savouretplus.savis.sales.order.domain.OrderItemAllocationType;
import com.savouretplus.savis.sales.order.domain.OrderItemProductType;
import com.savouretplus.savis.sales.order.domain.OrderSource;
import com.savouretplus.savis.sales.order.domain.OrderStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

/**
 * JPA entity storing an order aggregate and its immutable snapshots.
 */
@Getter
@Setter
@Entity
@Table(name = "orders", uniqueConstraints = {
        @UniqueConstraint(name = "uk_orders_source_external", columnNames = { "source", "external_order_id" })
})
public class OrderEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private UUID publicId;
    @Column(nullable = false, unique = true)
    private String orderNumber;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderSource source;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;
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
    private int discountCents;
    @Column(nullable = false)
    private int deliveryFeeCents;
    @Column(nullable = false)
    private int totalCents;
    private UUID externalOrderId;
    @Column(nullable = false)
    private Instant placedAt;
    @Column(nullable = false)
    private Instant importedAt;
    private Instant acceptedAt;
    private Instant inPreparationAt;
    private Instant readyAt;
    private Instant completedAt;
    private Instant cancelledAt;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> rawPayload = new LinkedHashMap<>();

    @BatchSize(size = 50)
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "order_id", nullable = false)
    private List<OrderItemEntity> items = new ArrayList<>();
}

/**
 * JPA entity storing one product snapshot attached to an order.
 */
@Getter
@Setter
@Entity
@Table(name = "order_items")
class OrderItemEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private UUID publicId;
    @Column(nullable = false)
    private UUID productId;
    @Column(nullable = false)
    private String productNameSnapshot;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderItemProductType productType;
    @Column(columnDefinition = "text")
    private String imageUrl;
    @Column(nullable = false)
    private int quantity;
    @Column(nullable = false)
    private int basePriceCents;
    @Column(nullable = false)
    private int unitPriceCents;
    @Column(nullable = false)
    private int lineTotalCents;
    private String purchaseModeId;
    private String purchaseModeLabel;
    private Integer purchaseModeQuantity;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderItemAllocationType allocationType;
    @Column(columnDefinition = "text")
    private String rawKey;

    @BatchSize(size = 100)
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "order_item_id", nullable = false)
    private List<OrderItemChoiceSelectionEntity> choiceSelections = new ArrayList<>();

    @BatchSize(size = 100)
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "order_item_id", nullable = false)
    private List<OrderItemChoiceAllocationEntity> choiceAllocations = new ArrayList<>();

    @BatchSize(size = 100)
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "order_item_id", nullable = false)
    private List<OrderItemIngredientSelectionEntity> ingredientSelections = new ArrayList<>();
}

/**
 * JPA entity storing one selected product choice snapshot.
 */
@Getter
@Setter
@Entity
@Table(name = "order_item_choice_selections")
class OrderItemChoiceSelectionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String choiceId;
    @Column(nullable = false)
    private String choiceName;
    @Column(nullable = false)
    private String groupLabel;
}

/**
 * JPA entity storing one allocated product choice snapshot.
 */
@Getter
@Setter
@Entity
@Table(name = "order_item_choice_allocations")
class OrderItemChoiceAllocationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String choiceId;
    @Column(nullable = false)
    private String choiceName;
    @Column(nullable = false)
    private int quantity;
}

/**
 * JPA entity storing one selected ingredient snapshot.
 */
@Getter
@Setter
@Entity
@Table(name = "order_item_ingredient_selections")
class OrderItemIngredientSelectionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String ingredientId;
    @Column(nullable = false)
    private String ingredientName;
    @Column(nullable = false)
    private int quantity;
    @Column(nullable = false)
    private int defaultQuantity;
    @Column(nullable = false)
    private int extraPriceCents;
}
