package com.savouretplus.savis.order.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderSource;

/**
 * Defines persistence operations for normalized orders.
 */
public interface OrderRepository {

    /**
     * Persists the provided order aggregate.
     */
    Order save(Order order);

    /**
     * Finds an order by its public identifier.
     */
    Optional<Order> findByPublicId(UUID publicId);

    /**
     * Returns all persisted orders.
     */
    List<Order> findAll();

    /**
     * Reports whether an order has already been imported from an external source.
     */
    boolean existsBySourceAndExternalOrderId(OrderSource source, UUID externalOrderId);

    /**
     * Finds an order created from the provided source identifier.
     */
    Optional<Order> findBySourceAndExternalOrderId(OrderSource source, UUID externalOrderId);
}
