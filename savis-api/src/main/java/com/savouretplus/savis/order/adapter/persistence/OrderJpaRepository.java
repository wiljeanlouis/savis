package com.savouretplus.savis.order.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.savouretplus.savis.order.domain.OrderSource;

/**
 * Spring Data repository for local order entities.
 */
interface OrderJpaRepository extends JpaRepository<OrderEntity, Long> {

    /**
     * Finds an order entity by its public identifier.
     */
    Optional<OrderEntity> findByPublicId(UUID publicId);

    /**
     * Returns order entities from newest to oldest.
     */
    List<OrderEntity> findAllByOrderByPlacedAtDesc();

    /**
     * Reports whether an external order has already been persisted.
     */
    boolean existsBySourceAndExternalOrderId(OrderSource source, UUID externalOrderId);
}
