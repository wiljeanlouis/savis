package com.savouretplus.savis.sales.order.api.workspace;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Read-only order snapshots used by the commercial workspace. */
public interface SalesOrderWorkspaceApi {
    List<Order> orders();

    record Order(
            UUID id,
            String reference,
            String source,
            UUID sourceId,
            String status,
            String customerName,
            String customerPhone,
            String customerEmail,
            String description,
            int amountCents,
            Instant lastActivity) {
    }
}
