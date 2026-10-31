package com.savouretplus.savis.sales.order.domain;

/**
 * Defines the lifecycle of a customer order.
 */
public enum OrderStatus {
    NEW,
    ACCEPTED,
    IN_PREPARATION,
    READY,
    COMPLETED,
    CANCELLED,
    REJECTED
}
