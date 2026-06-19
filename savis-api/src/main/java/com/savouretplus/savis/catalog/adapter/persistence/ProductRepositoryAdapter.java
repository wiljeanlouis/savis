package com.savouretplus.savis.catalog.adapter.persistence;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;

import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductBom;
import com.savouretplus.savis.catalog.domain.ProductChoiceGroup;
import com.savouretplus.savis.catalog.domain.ProductChoiceOption;
import com.savouretplus.savis.catalog.domain.ProductIngredientOption;
import com.savouretplus.savis.catalog.domain.ProductPurchaseMode;
import com.savouretplus.savis.catalog.port.ProductRepository;
import com.savouretplus.savis.common.Money;

import lombok.AllArgsConstructor;

/**
 * Persists catalog products through Spring Data JPA.
 */
@Repository
@AllArgsConstructor
public class ProductRepositoryAdapter implements ProductRepository {
    private final ProductJpaRepository repository;

    /**
     * Persists the provided aggregate.
     */
    @Override
    public Product save(Product product) {
        ProductEntity entity = repository.findByPublicId(product.publicId()).orElseGet(ProductEntity::new);
        update(entity, product);
        /**
         * Converts this DTO to its domain representation.
         */
        return toDomain(repository.save(entity));
    }

    /**
     * Finds an aggregate by its public identifier.
     */
    @Override
    public Optional<Product> findByPublicId(UUID publicId) {
        return repository.findByPublicId(publicId).map(this::toDomain);
    }

    /**
     * Returns all persisted aggregates.
     */
    @Override
    public List<Product> findAll() {
        return repository.findAllByOrderByDisplayOrderAscNameAsc().stream().map(this::toDomain).toList();
    }

    /**
     * Returns all products currently marked as published.
     */
    @Override
    public List<Product> findAllPublished() {
        return repository.findByPublishedTrueOrderByDisplayOrderAscNameAsc().stream().map(this::toDomain).toList();
    }

    /**
     * Deletes the provided aggregate.
     */
    @Override
    public void delete(Product product) {
        repository.findByPublicId(product.publicId()).ifPresent(repository::delete);
    }

    private void update(ProductEntity entity, Product product) {
        entity.setPublicId(product.publicId());
        entity.setCode(product.code());
        entity.setSlug(product.slug());
        entity.setName(product.name());
        entity.setDescription(product.description());
        entity.setProductType(product.productType());
        entity.setCategoryPublicId(product.categoryId());
        entity.setBasePriceAmount(product.basePrice().amount());
        entity.setBasePriceCurrency(product.basePrice().currency());
        entity.setTargetMarginRate(product.targetMarginRate());
        entity.setUnitLabel(product.unitLabel());
        entity.setImageUrl(product.imageUrl());
        entity.setGallery(new ArrayList<>(product.gallery()));
        entity.setAvailabilityNote(product.availabilityNote());
        entity.setAvailable(product.available());
        entity.setPublished(product.published());
        entity.setDisplayOrder(product.displayOrder());
        reconcileProductBoms(entity.getProductBoms(), product.productBoms());
        reconcilePurchaseModes(entity.getPurchaseModes(), product.purchaseModes());
        reconcileChoiceGroup(entity, product.choiceGroup());
        reconcileIngredientOptions(entity.getIngredientOptions(), product.ingredientOptions());
    }

    private Product toDomain(ProductEntity entity) {
        List<ProductBom> productBoms = entity.getProductBoms().stream()
                .map(this::toDomain)
                .sorted(Comparator.comparingInt(ProductBom::displayOrder))
                .toList();
        List<ProductPurchaseMode> modes = entity.getPurchaseModes().stream()
                .map(this::toDomain)
                .sorted(Comparator.comparingInt(ProductPurchaseMode::displayOrder))
                .toList();
        List<ProductIngredientOption> ingredients = entity.getIngredientOptions().stream()
                .map(this::toDomain)
                .sorted(Comparator.comparingInt(ProductIngredientOption::displayOrder))
                .toList();
        return new Product(
                entity.getPublicId(), entity.getCode(), entity.getSlug(), entity.getName(),
                entity.getDescription(), entity.getProductType(), entity.getCategoryPublicId(),
                productBoms, new Money(entity.getBasePriceAmount(), entity.getBasePriceCurrency()),
                entity.getTargetMarginRate(), entity.getUnitLabel(), entity.getImageUrl(),
                entity.getGallery(), entity.getAvailabilityNote(), entity.isAvailable(), entity.isPublished(),
                entity.getDisplayOrder(), modes,
                entity.getChoiceGroup() != null ? toDomain(entity.getChoiceGroup()) : null, ingredients);
    }

    private void update(ProductBomEntity entity, ProductBom productBom) {
        entity.setPublicId(productBom.publicId());
        entity.setBomId(productBom.bomId());
        entity.setQuantity(productBom.quantity());
        entity.setDisplayOrder(productBom.displayOrder());
    }

    private ProductBom toDomain(ProductBomEntity entity) {
        return new ProductBom(
                entity.getPublicId(), entity.getBomId(), entity.getQuantity(), entity.getDisplayOrder());
    }

    private void update(ProductPurchaseModeEntity entity, ProductPurchaseMode mode) {
        entity.setPublicId(mode.publicId());
        entity.setCode(mode.code());
        entity.setLabel(mode.label());
        entity.setQuantity(mode.quantity());
        entity.setPriceAmount(mode.price().amount());
        entity.setPriceCurrency(mode.price().currency());
        entity.setAllocationType(mode.allocationType());
        entity.setActive(mode.active());
        entity.setDisplayOrder(mode.displayOrder());
    }

    private ProductPurchaseMode toDomain(ProductPurchaseModeEntity entity) {
        return new ProductPurchaseMode(entity.getPublicId(), entity.getCode(), entity.getLabel(),
                entity.getQuantity(), new Money(entity.getPriceAmount(), entity.getPriceCurrency()),
                entity.getAllocationType(), entity.isActive(), entity.getDisplayOrder());
    }

    private void update(ProductChoiceGroupEntity entity, ProductChoiceGroup group) {
        entity.setPublicId(group.publicId());
        entity.setLabel(group.label());
        entity.setRequired(group.required());
        reconcileChoiceOptions(entity.getOptions(), group.options());
    }

    private ProductChoiceGroup toDomain(ProductChoiceGroupEntity entity) {
        return new ProductChoiceGroup(entity.getPublicId(), entity.getLabel(), entity.isRequired(),
                entity.getOptions().stream().map(this::toDomain)
                        .sorted(Comparator.comparingInt(ProductChoiceOption::displayOrder)).toList());
    }

    private void update(ProductChoiceOptionEntity entity, ProductChoiceOption option) {
        entity.setPublicId(option.publicId());
        entity.setCode(option.code());
        entity.setName(option.name());
        entity.setBomId(option.bomId());
        entity.setActive(option.active());
        entity.setDisplayOrder(option.displayOrder());
    }

    private ProductChoiceOption toDomain(ProductChoiceOptionEntity entity) {
        return new ProductChoiceOption(entity.getPublicId(), entity.getCode(), entity.getName(),
                entity.getBomId(), entity.isActive(), entity.getDisplayOrder());
    }

    private void update(ProductIngredientOptionEntity entity, ProductIngredientOption option) {
        entity.setPublicId(option.publicId());
        entity.setCode(option.code());
        entity.setName(option.name());
        entity.setBomId(option.bomId());
        entity.setDefaultQuantity(option.defaultQuantity());
        entity.setMinQuantity(option.minQuantity());
        entity.setMaxQuantity(option.maxQuantity());
        entity.setExtraPriceAmount(option.extraPrice().amount());
        entity.setExtraPriceCurrency(option.extraPrice().currency());
        entity.setActive(option.active());
        entity.setDisplayOrder(option.displayOrder());
    }

    private ProductIngredientOption toDomain(ProductIngredientOptionEntity entity) {
        return new ProductIngredientOption(entity.getPublicId(), entity.getCode(), entity.getName(),
                entity.getBomId(), entity.getDefaultQuantity(), entity.getMinQuantity(), entity.getMaxQuantity(),
                new Money(entity.getExtraPriceAmount(), entity.getExtraPriceCurrency()),
                entity.isActive(), entity.getDisplayOrder());
    }

    private void reconcilePurchaseModes(
            List<ProductPurchaseModeEntity> entities,
            List<ProductPurchaseMode> modes) {
        reconcile(
                entities,
                modes,
                ProductPurchaseModeEntity::getPublicId,
                ProductPurchaseMode::publicId,
                ProductPurchaseModeEntity::new,
                this::update);
        entities.sort(Comparator.comparingInt(ProductPurchaseModeEntity::getDisplayOrder));
    }

    private void reconcileProductBoms(
            List<ProductBomEntity> entities,
            List<ProductBom> productBoms) {
        reconcile(
                entities,
                productBoms,
                ProductBomEntity::getPublicId,
                ProductBom::publicId,
                ProductBomEntity::new,
                this::update);
        entities.sort(Comparator.comparingInt(ProductBomEntity::getDisplayOrder));
    }

    private void reconcileChoiceGroup(ProductEntity productEntity, ProductChoiceGroup group) {
        if (group == null) {
            productEntity.setChoiceGroup(null);
            return;
        }

        ProductChoiceGroupEntity entity = productEntity.getChoiceGroup();
        if (entity == null || !group.publicId().equals(entity.getPublicId())) {
            entity = new ProductChoiceGroupEntity();
            productEntity.setChoiceGroup(entity);
        }
        update(entity, group);
    }

    private void reconcileChoiceOptions(
            List<ProductChoiceOptionEntity> entities,
            List<ProductChoiceOption> options) {
        reconcile(
                entities,
                options,
                ProductChoiceOptionEntity::getPublicId,
                ProductChoiceOption::publicId,
                ProductChoiceOptionEntity::new,
                this::update);
        entities.sort(Comparator.comparingInt(ProductChoiceOptionEntity::getDisplayOrder));
    }

    private void reconcileIngredientOptions(
            List<ProductIngredientOptionEntity> entities,
            List<ProductIngredientOption> options) {
        reconcile(
                entities,
                options,
                ProductIngredientOptionEntity::getPublicId,
                ProductIngredientOption::publicId,
                ProductIngredientOptionEntity::new,
                this::update);
        entities.sort(Comparator.comparingInt(ProductIngredientOptionEntity::getDisplayOrder));
    }

    private <E, D> void reconcile(
            List<E> entities,
            List<D> desired,
            Function<E, UUID> entityId,
            Function<D, UUID> domainId,
            java.util.function.Supplier<E> factory,
            java.util.function.BiConsumer<E, D> updater) {
        Map<UUID, E> existing = entities.stream()
                .collect(Collectors.toMap(entityId, Function.identity()));
        var desiredIds = desired.stream().map(domainId).collect(Collectors.toSet());
        entities.removeIf(entity -> !desiredIds.contains(entityId.apply(entity)));

        for (D value : desired) {
            E entity = existing.get(domainId.apply(value));
            if (entity == null) {
                entity = factory.get();
                entities.add(entity);
            }
            updater.accept(entity, value);
        }
    }
}
