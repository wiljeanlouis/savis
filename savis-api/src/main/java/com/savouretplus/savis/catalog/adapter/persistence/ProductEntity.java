package com.savouretplus.savis.catalog.adapter.persistence;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.savouretplus.savis.catalog.domain.AllocationType;
import com.savouretplus.savis.catalog.domain.ProductType;

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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * JPA entity storing a catalog product and its owned configuration rows.
 */
@Getter
@Setter
@Entity
@Table(name = "catalog_products")
public class ProductEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private UUID publicId;
    @Column(nullable = false, unique = true)
    private String code;
    @Column(nullable = false, unique = true)
    private String slug;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false, columnDefinition = "text")
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductType productType;
    @Column(nullable = false)
    private UUID categoryPublicId;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal basePriceAmount;
    @Column(nullable = false, length = 3)
    private String basePriceCurrency;
    @Column(nullable = false, precision = 7, scale = 6)
    private BigDecimal targetMarginRate;
    @Column(nullable = false)
    private String unitLabel;
    @Column(nullable = false, columnDefinition = "text")
    private String imageUrl;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<String> gallery = new ArrayList<>();
    @Column(nullable = false)
    private String availabilityNote;
    @Column(nullable = false)
    private boolean available;
    @Column(nullable = false)
    private boolean published;
    @Column(nullable = false)
    private int displayOrder;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "product_id", nullable = false)
    private List<ProductBomEntity> productBoms = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "product_id", nullable = false)
    private List<ProductPurchaseModeEntity> purchaseModes = new ArrayList<>();

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "choice_group_id")
    private ProductChoiceGroupEntity choiceGroup;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "product_id", nullable = false)
    private List<ProductIngredientOptionEntity> ingredientOptions = new ArrayList<>();
}

/**
 * JPA entity storing the BOM link for a catalog product.
 */
@Getter
@Setter
@Entity
@Table(name = "catalog_product_boms")
class ProductBomEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private UUID publicId;
    @Column(nullable = false)
    private UUID bomId;
    @Column(nullable = false, precision = 14, scale = 6)
    private BigDecimal quantity;
    @Column(nullable = false)
    private int displayOrder;
}

/**
 * JPA entity storing one purchase mode for a catalog product.
 */
@Getter
@Setter
@Entity
@Table(name = "catalog_product_purchase_modes")
class ProductPurchaseModeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private UUID publicId;
    @Column(nullable = false)
    private String code;
    @Column(nullable = false)
    private String label;
    @Column(nullable = false)
    private int quantity;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal priceAmount;
    @Column(nullable = false, length = 3)
    private String priceCurrency;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AllocationType allocationType;
    @Column(nullable = false)
    private boolean active;
    @Column(nullable = false)
    private int displayOrder;
}

/**
 * JPA entity storing a choice group for a catalog product.
 */
@Getter
@Setter
@Entity
@Table(name = "catalog_product_choice_groups")
class ProductChoiceGroupEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private UUID publicId;
    @Column(nullable = false)
    private String label;
    @Column(nullable = false)
    private boolean required;
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "choice_group_id", nullable = false)
    private List<ProductChoiceOptionEntity> options = new ArrayList<>();
}

/**
 * JPA entity storing one option within a product choice group.
 */
@Getter
@Setter
@Entity
@Table(name = "catalog_product_choice_options")
class ProductChoiceOptionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private UUID publicId;
    @Column(nullable = false)
    private String code;
    @Column(nullable = false)
    private String name;
    private UUID bomId;
    @Column(nullable = false)
    private boolean active;
    @Column(nullable = false)
    private int displayOrder;
}

/**
 * JPA entity storing one configurable ingredient option for a catalog product.
 */
@Getter
@Setter
@Entity
@Table(name = "catalog_product_ingredient_options")
class ProductIngredientOptionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private UUID publicId;
    @Column(nullable = false)
    private String code;
    @Column(nullable = false)
    private String name;
    private UUID bomId;
    @Column(nullable = false)
    private int defaultQuantity;
    @Column(nullable = false)
    private int minQuantity;
    @Column(nullable = false)
    private int maxQuantity;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal extraPriceAmount;
    @Column(nullable = false, length = 3)
    private String extraPriceCurrency;
    @Column(nullable = false)
    private boolean active;
    @Column(nullable = false)
    private int displayOrder;
}
