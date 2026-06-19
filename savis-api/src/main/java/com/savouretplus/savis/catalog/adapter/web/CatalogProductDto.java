package com.savouretplus.savis.catalog.adapter.web;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.catalog.domain.AllocationType;
import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductBom;
import com.savouretplus.savis.catalog.domain.ProductChoiceGroup;
import com.savouretplus.savis.catalog.domain.ProductChoiceOption;
import com.savouretplus.savis.catalog.domain.ProductIngredientOption;
import com.savouretplus.savis.catalog.domain.ProductPurchaseMode;
import com.savouretplus.savis.catalog.domain.ProductType;
import com.savouretplus.savis.common.Money;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * DTO used to exchange catalog product data over the web API.
 */
public record CatalogProductDto(
        UUID id,
        @NotBlank String code,
        @NotBlank String slug,
        @NotBlank String name,
        String description,
        @NotNull ProductType productType,
        @NotNull UUID categoryId,
        List<@Valid ProductBomDto> productBoms,
        @NotNull Money basePrice,
        @NotNull BigDecimal targetMarginRate,
        String unitLabel,
        @NotBlank String imageUrl,
        List<String> gallery,
        String availabilityNote,
        boolean available,
        boolean published,
        @PositiveOrZero int displayOrder,
        List<@Valid PurchaseModeDto> purchaseModes,
        @Valid ChoiceGroupDto choiceGroup,
        List<@Valid IngredientOptionDto> ingredientOptions) {

    /**
     * Converts this DTO into its domain representation.
     */
    public Product toDomain() {
        return toDomain(id);
    }

    /**
     * Converts this DTO into its domain representation.
     */
    public Product toDomain(UUID productId) {
        return new Product(productId, code, slug, name, description, productType, categoryId,
                safe(productBoms).stream().map(ProductBomDto::toDomain).toList(),
                basePrice, targetMarginRate, unitLabel, imageUrl, gallery, availabilityNote,
                available, published, displayOrder,
                safe(purchaseModes).stream().map(PurchaseModeDto::toDomain).toList(),
                choiceGroup != null ? choiceGroup.toDomain() : null,
                safe(ingredientOptions).stream().map(IngredientOptionDto::toDomain).toList());
    }

    /**
     * Creates a DTO or API value from the provided domain object.
     */
    public static CatalogProductDto from(Product product) {
        return new CatalogProductDto(
                product.publicId(), product.code(), product.slug(), product.name(), product.description(),
                product.productType(), product.categoryId(),
                product.productBoms().stream().map(ProductBomDto::from).toList(), product.basePrice(),
                product.targetMarginRate(), product.unitLabel(), product.imageUrl(), product.gallery(),
                product.availabilityNote(), product.available(), product.published(), product.displayOrder(),
                product.purchaseModes().stream().map(PurchaseModeDto::from).toList(),
                product.choiceGroup() != null ? ChoiceGroupDto.from(product.choiceGroup()) : null,
                product.ingredientOptions().stream().map(IngredientOptionDto::from).toList());
    }

    private static <T> List<T> safe(List<T> values) {
        return values != null ? values : List.of();
    }

    /**
     * DTO value used to exchange a product-to-BOM link.
     */
    public record ProductBomDto(
            UUID id, @NotNull UUID bomId, @NotNull BigDecimal quantity, @PositiveOrZero int displayOrder) {
        /**
         * Converts this DTO into its domain representation.
         */
        ProductBom toDomain() {
            return new ProductBom(id, bomId, quantity, displayOrder);
        }

        /**
         * Creates a DTO from a product-to-BOM domain link.
         */
        static ProductBomDto from(ProductBom productBom) {
            return new ProductBomDto(
                    productBom.publicId(), productBom.bomId(), productBom.quantity(), productBom.displayOrder());
        }
    }

    /**
     * DTO value used to exchange a product purchase mode.
     */
    public record PurchaseModeDto(
            UUID id, @NotBlank String code, @NotBlank String label, int quantity,
            @NotNull Money price, @NotNull AllocationType allocationType,
            boolean active, int displayOrder) {
        /**
         * Converts this DTO into its domain representation.
         */
        ProductPurchaseMode toDomain() {
            return new ProductPurchaseMode(id, code, label, quantity, price, allocationType, active, displayOrder);
        }

        /**
         * Creates a DTO from a product purchase mode.
         */
        static PurchaseModeDto from(ProductPurchaseMode mode) {
            return new PurchaseModeDto(mode.publicId(), mode.code(), mode.label(), mode.quantity(),
                    mode.price(), mode.allocationType(), mode.active(), mode.displayOrder());
        }
    }

    /**
     * DTO value used to exchange a product choice group.
     */
    public record ChoiceGroupDto(
            UUID id, @NotBlank String label, boolean required, List<@Valid ChoiceOptionDto> options) {
        /**
         * Converts this DTO into its domain representation.
         */
        ProductChoiceGroup toDomain() {
            return new ProductChoiceGroup(id, label, required,
                    safe(options).stream().map(ChoiceOptionDto::toDomain).toList());
        }

        /**
         * Creates a DTO from a product choice group.
         */
        static ChoiceGroupDto from(ProductChoiceGroup group) {
            return new ChoiceGroupDto(group.publicId(), group.label(), group.required(),
                    group.options().stream().map(ChoiceOptionDto::from).toList());
        }
    }

    /**
     * DTO value used to exchange a product choice option.
     */
    public record ChoiceOptionDto(
            UUID id, @NotBlank String code, @NotBlank String name, UUID bomId,
            boolean active, int displayOrder) {
        /**
         * Converts this DTO into its domain representation.
         */
        ProductChoiceOption toDomain() {
            return new ProductChoiceOption(id, code, name, bomId, active, displayOrder);
        }

        /**
         * Creates a DTO from a product choice option.
         */
        static ChoiceOptionDto from(ProductChoiceOption option) {
            return new ChoiceOptionDto(option.publicId(), option.code(), option.name(), option.bomId(),
                    option.active(), option.displayOrder());
        }
    }

    /**
     * DTO value used to exchange a product ingredient option.
     */
    public record IngredientOptionDto(
            UUID id, @NotBlank String code, @NotBlank String name, UUID bomId,
            int defaultQuantity, int minQuantity, int maxQuantity, @NotNull Money extraPrice,
            boolean active, int displayOrder) {
        /**
         * Converts this DTO into its domain representation.
         */
        ProductIngredientOption toDomain() {
            return new ProductIngredientOption(id, code, name, bomId, defaultQuantity, minQuantity,
                    maxQuantity, extraPrice, active, displayOrder);
        }

        /**
         * Creates a DTO from a product ingredient option.
         */
        static IngredientOptionDto from(ProductIngredientOption option) {
            return new IngredientOptionDto(option.publicId(), option.code(), option.name(), option.bomId(),
                    option.defaultQuantity(), option.minQuantity(), option.maxQuantity(), option.extraPrice(),
                    option.active(), option.displayOrder());
        }
    }
}
