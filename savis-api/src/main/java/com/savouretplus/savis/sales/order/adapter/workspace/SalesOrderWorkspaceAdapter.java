package com.savouretplus.savis.sales.order.adapter.workspace;

import java.util.Comparator;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.sales.order.api.workspace.SalesOrderWorkspaceApi;
import com.savouretplus.savis.sales.order.port.OrderRepository;
import lombok.RequiredArgsConstructor;

/** Maps owned order aggregates to the workspace's read-only contract. */
@Component
@RequiredArgsConstructor
class SalesOrderWorkspaceAdapter implements SalesOrderWorkspaceApi {
    private final OrderRepository orders;

    @Override
    public java.util.List<Order> orders() {
        return orders.findAll().stream()
                .map(order -> new Order(
                        order.publicId(),
                        order.orderNumber(),
                        order.source().name(),
                        order.externalOrderId(),
                        order.status().name(),
                        order.customerName(),
                        order.customerPhone(),
                        order.customerEmail(),
                        order.note(),
                        order.totalCents(),
                        java.util.stream.Stream.of(
                                order.placedAt(),
                                order.acceptedAt(),
                                order.inPreparationAt(),
                                order.readyAt(),
                                order.completedAt(),
                                order.cancelledAt())
                                .filter(java.util.Objects::nonNull)
                                .max(Comparator.naturalOrder())
                                .orElse(order.importedAt())))
                .toList();
    }
}
