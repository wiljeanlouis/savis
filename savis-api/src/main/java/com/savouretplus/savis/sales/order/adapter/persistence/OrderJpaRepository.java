package com.savouretplus.savis.sales.order.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import com.savouretplus.savis.sales.order.domain.OrderSource;

import jakarta.persistence.LockModeType;

/**
 * Spring Data repository for local order entities.
 */
interface OrderJpaRepository extends JpaRepository<OrderEntity, Long> {

    /**
     * Finds an order entity by its public identifier.
     */
    Optional<OrderEntity> findByPublicId(UUID publicId);

    /**
     * Finds an order entity while preventing concurrent invoice creation.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<OrderEntity> findForUpdateByPublicId(UUID publicId);

    /**
     * Returns order entities from newest to oldest.
     */
    List<OrderEntity> findAllByOrderByPlacedAtDesc();

    /**
     * Reports whether an external order has already been persisted.
     */
    boolean existsBySourceAndExternalOrderId(OrderSource source, UUID externalOrderId);

    /**
     * Finds an order entity by its source and origin identifier.
     */
    Optional<OrderEntity> findBySourceAndExternalOrderId(OrderSource source, UUID externalOrderId);
}
