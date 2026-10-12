package com.savouretplus.savis.order.adapter.persistence;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderAddress;
import com.savouretplus.savis.order.domain.OrderItem;
import com.savouretplus.savis.order.domain.OrderItemChoiceAllocation;
import com.savouretplus.savis.order.domain.OrderItemChoiceSelection;
import com.savouretplus.savis.order.domain.OrderItemIngredientSelection;
import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.port.OrderRepository;

import lombok.AllArgsConstructor;

/**
 * Persists and reconstructs complete order aggregates through JPA.
 */
@Repository
@AllArgsConstructor
public class OrderRepositoryAdapter implements OrderRepository {
    private final OrderJpaRepository repository;

    /**
     * Persists a complete order aggregate and its item snapshots.
     */
    @Override
    @Transactional
    public Order save(Order order) {
        OrderEntity entity = repository.findByPublicId(order.publicId()).orElseGet(OrderEntity::new);
        update(entity, order);
        return toDomain(repository.saveAndFlush(entity));
    }

    /**
     * Finds and reconstructs an order by its public identifier.
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<Order> findByPublicId(UUID publicId) {
        return repository.findByPublicId(publicId).map(this::toDomain);
    }

    /**
     * Returns all reconstructed orders from newest to oldest.
     */
    @Override
    @Transactional(readOnly = true)
    public List<Order> findAll() {
        return repository.findAllByOrderByPlacedAtDesc().stream().map(this::toDomain).toList();
    }

    /**
     * Reports whether an order has already been imported from an external source.
     */
    @Override
    @Transactional(readOnly = true)
    public boolean existsBySourceAndExternalOrderId(OrderSource source, UUID externalOrderId) {
        return repository.existsBySourceAndExternalOrderId(source, externalOrderId);
    }

    private void update(OrderEntity entity, Order order) {
        entity.setPublicId(order.publicId());
        entity.setOrderNumber(order.orderNumber());
        entity.setSource(order.source());
        entity.setStatus(order.status());
        entity.setCustomerName(order.customerName());
        entity.setCustomerPhone(order.customerPhone());
        entity.setCustomerEmail(order.customerEmail());
        OrderAddress address = order.customerAddress();
        entity.setCustomerAddressLine1(address == null ? null : address.line1());
        entity.setCustomerAddressLine2(address == null ? null : address.line2());
        entity.setCustomerCity(address == null ? null : address.city());
        entity.setCustomerProvince(address == null ? null : address.province());
        entity.setCustomerPostalCode(address == null ? null : address.postalCode());
        entity.setNote(order.note());
        entity.setDiscountCents(order.discountCents());
        entity.setDeliveryFeeCents(order.deliveryFeeCents());
        entity.setTotalCents(order.totalCents());
        entity.setExternalOrderId(order.externalOrderId());
        entity.setPlacedAt(order.placedAt());
        entity.setImportedAt(order.importedAt());
        entity.setAcceptedAt(order.acceptedAt());
        entity.setInPreparationAt(order.inPreparationAt());
        entity.setReadyAt(order.readyAt());
        entity.setCompletedAt(order.completedAt());
        entity.setCancelledAt(order.cancelledAt());
        entity.setRawPayload(new LinkedHashMap<>(order.rawPayload()));
        reconcile(
                entity.getItems(), order.items(), OrderItemEntity::getPublicId, OrderItem::publicId,
                OrderItemEntity::new, this::update);
    }

    private void update(OrderItemEntity entity, OrderItem item) {
        entity.setPublicId(item.publicId());
        entity.setProductId(item.productId());
        entity.setProductNameSnapshot(item.productNameSnapshot());
        entity.setProductType(item.productType());
        entity.setImageUrl(item.imageUrl());
        entity.setQuantity(item.quantity());
        entity.setBasePriceCents(item.basePriceCents());
        entity.setUnitPriceCents(item.unitPriceCents());
        entity.setLineTotalCents(item.lineTotalCents());
        entity.setPurchaseModeId(item.purchaseModeId());
        entity.setPurchaseModeLabel(item.purchaseModeLabel());
        entity.setPurchaseModeQuantity(item.purchaseModeQuantity());
        entity.setAllocationType(item.allocationType());
        entity.setRawKey(item.rawKey());
        reconcile(
                entity.getChoiceSelections(), item.choiceSelections(), OrderItemChoiceSelectionEntity::getId,
                OrderItemChoiceSelection::id, OrderItemChoiceSelectionEntity::new, this::update);
        reconcile(
                entity.getChoiceAllocations(), item.choiceAllocations(), OrderItemChoiceAllocationEntity::getId,
                OrderItemChoiceAllocation::id, OrderItemChoiceAllocationEntity::new, this::update);
        reconcile(
                entity.getIngredientSelections(), item.ingredientSelections(),
                OrderItemIngredientSelectionEntity::getId, OrderItemIngredientSelection::id,
                OrderItemIngredientSelectionEntity::new, this::update);
    }

    private void update(OrderItemChoiceSelectionEntity entity, OrderItemChoiceSelection selection) {
        entity.setChoiceId(selection.choiceId());
        entity.setChoiceName(selection.choiceName());
        entity.setGroupLabel(selection.groupLabel());
    }

    private void update(OrderItemChoiceAllocationEntity entity, OrderItemChoiceAllocation allocation) {
        entity.setChoiceId(allocation.choiceId());
        entity.setChoiceName(allocation.choiceName());
        entity.setQuantity(allocation.quantity());
    }

    private void update(OrderItemIngredientSelectionEntity entity, OrderItemIngredientSelection ingredient) {
        entity.setIngredientId(ingredient.ingredientId());
        entity.setIngredientName(ingredient.ingredientName());
        entity.setQuantity(ingredient.quantity());
        entity.setDefaultQuantity(ingredient.defaultQuantity());
        entity.setExtraPriceCents(ingredient.extraPriceCents());
    }

    private Order toDomain(OrderEntity entity) {
        return new Order(
                entity.getId(), entity.getPublicId(), entity.getOrderNumber(), entity.getSource(), entity.getStatus(),
                entity.getCustomerName(), entity.getCustomerPhone(), entity.getCustomerEmail(), address(entity),
                entity.getNote(), entity.getDiscountCents(), entity.getDeliveryFeeCents(), entity.getTotalCents(),
                entity.getExternalOrderId(), entity.getPlacedAt(), entity.getImportedAt(),
                entity.getAcceptedAt(), entity.getInPreparationAt(), entity.getReadyAt(), entity.getCompletedAt(),
                entity.getCancelledAt(), entity.getItems().stream().map(this::toDomain).toList(),
                entity.getRawPayload());
    }

    private OrderAddress address(OrderEntity entity) {
        OrderAddress address = new OrderAddress(
                entity.getCustomerAddressLine1(),
                entity.getCustomerAddressLine2(),
                entity.getCustomerCity(),
                entity.getCustomerProvince(),
                entity.getCustomerPostalCode());
        return address.isEmpty() ? null : address;
    }

    private OrderItem toDomain(OrderItemEntity entity) {
        return new OrderItem(
                entity.getId(), entity.getPublicId(), entity.getProductId(), entity.getProductNameSnapshot(),
                entity.getProductType(), entity.getImageUrl(), entity.getQuantity(), entity.getBasePriceCents(),
                entity.getUnitPriceCents(), entity.getLineTotalCents(), entity.getPurchaseModeId(),
                entity.getPurchaseModeLabel(), entity.getPurchaseModeQuantity(), entity.getAllocationType(),
                entity.getRawKey(),
                entity.getChoiceSelections().stream().map(value -> new OrderItemChoiceSelection(
                        value.getId(), value.getChoiceId(), value.getChoiceName(), value.getGroupLabel())).toList(),
                entity.getChoiceAllocations().stream().map(value -> new OrderItemChoiceAllocation(
                        value.getId(), value.getChoiceId(), value.getChoiceName(), value.getQuantity())).toList(),
                entity.getIngredientSelections().stream().map(value -> new OrderItemIngredientSelection(
                        value.getId(), value.getIngredientId(), value.getIngredientName(), value.getQuantity(),
                        value.getDefaultQuantity(), value.getExtraPriceCents())).toList());
    }

    private <E, D, K> void reconcile(
            List<E> entities,
            List<D> desired,
            Function<E, K> entityId,
            Function<D, K> domainId,
            Supplier<E> factory,
            BiConsumer<E, D> updater) {
        Map<K, E> existing = entities.stream()
                .filter(entity -> entityId.apply(entity) != null)
                .collect(Collectors.toMap(entityId, Function.identity()));
        List<E> reconciled = new ArrayList<>();
        for (D value : desired) {
            K key = domainId.apply(value);
            E entity = key != null ? existing.get(key) : null;
            if (entity == null) {
                entity = factory.get();
            }
            updater.accept(entity, value);
            reconciled.add(entity);
        }
        entities.clear();
        entities.addAll(reconciled);
    }
}
