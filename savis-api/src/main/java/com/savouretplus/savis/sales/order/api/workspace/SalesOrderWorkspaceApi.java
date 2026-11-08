package com.savouretplus.savis.sales.order.api.workspace;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Read-only order snapshots used by the commercial workspace. */
public interface SalesOrderWorkspaceApi {
    /** @return all owned orders as detached read snapshots, before workspace pagination */
    List<Order> orders();

    /**
     * Document snapshot with public UUID references and integer-cent amounts.
     * Lifecycle strings retain the owning module's enum names. Last activity is
     * supplied by the owner and is not necessarily the latest database update.
     */
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
