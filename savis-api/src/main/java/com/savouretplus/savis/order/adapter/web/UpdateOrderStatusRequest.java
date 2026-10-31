package com.savouretplus.savis.order.adapter.web;

import com.savouretplus.savis.order.domain.OrderStatus;

import jakarta.validation.constraints.NotNull;

/**
 * Represents a request to advance or terminate an order lifecycle.
 */
public record UpdateOrderStatusRequest(@NotNull OrderStatus status) {
}
