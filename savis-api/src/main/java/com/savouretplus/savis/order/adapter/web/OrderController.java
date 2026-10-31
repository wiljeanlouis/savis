package com.savouretplus.savis.order.adapter.web;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.savouretplus.savis.order.usecase.ImportOrdersUseCase;
import com.savouretplus.savis.order.usecase.OrderService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

/**
 * Exposes REST endpoints for manual order import and administration.
 */
@RestController
@RequestMapping("/api/orders")
@AllArgsConstructor
public class OrderController {
    private final OrderService orders;
    private final ImportOrdersUseCase importer;

    /**
     * Creates a new administrative order from current catalog products.
     */
    @PostMapping
    public OrderResponse create(@Valid @RequestBody CreateOrderRequest request) {
        return OrderResponse.from(orders.create(request.toCommand()));
    }

    /**
     * Imports all pending customer orders from the configured inbox.
     */
    @PostMapping("/import")
    public ImportOrdersResponse importOrders() {
        return ImportOrdersResponse.from(importer.execute());
    }

    /**
     * Returns the administrative order list.
     */
    @GetMapping
    public List<OrderSummaryResponse> list() {
        return orders.list().stream().map(OrderSummaryResponse::from).toList();
    }

    /**
     * Returns the complete details of one order.
     */
    @GetMapping("/{orderId}")
    public OrderResponse get(@PathVariable UUID orderId) {
        return OrderResponse.from(orders.get(orderId));
    }

    /**
     * Replaces an editable administrative order from current catalog products.
     */
    @PutMapping("/{orderId}")
    public OrderResponse update(
            @PathVariable UUID orderId,
            @Valid @RequestBody CreateOrderRequest request) {
        return OrderResponse.from(orders.update(orderId, request.toCommand()));
    }

    /**
     * Corrects customer information on a new imported web order.
     */
    @PatchMapping("/{orderId}/customer")
    public OrderResponse updateWebCustomer(
            @PathVariable UUID orderId,
            @Valid @RequestBody UpdateOrderCustomerRequest request) {
        return OrderResponse.from(orders.updateWebCustomer(orderId, request.toCommand()));
    }

    /**
     * Generates the current production-component requirements for one order.
     */
    @GetMapping("/{orderId}/requirements")
    public OrderRequirementReportResponse requirements(@PathVariable UUID orderId) {
        return OrderRequirementReportResponse.from(orders.requirementReport(orderId));
    }

    /**
     * Applies a lifecycle status transition to an order.
     */
    @PutMapping("/{orderId}/status")
    public OrderResponse updateStatus(
            @PathVariable UUID orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return OrderResponse.from(orders.updateStatus(orderId, request.status()));
    }
}
