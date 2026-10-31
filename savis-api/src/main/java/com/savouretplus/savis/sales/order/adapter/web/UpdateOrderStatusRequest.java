package com.savouretplus.savis.sales.order.adapter.web;

import com.savouretplus.savis.sales.order.domain.OrderStatus;

import jakarta.validation.constraints.NotNull;

/**
 * Represents a request to advance or terminate an order lifecycle.
 */
public record UpdateOrderStatusRequest(@NotNull OrderStatus status) {
}
