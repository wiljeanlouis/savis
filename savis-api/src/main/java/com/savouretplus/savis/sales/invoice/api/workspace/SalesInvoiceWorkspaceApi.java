package com.savouretplus.savis.sales.invoice.api.workspace;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Read-only invoice snapshots used by the commercial workspace. */
public interface SalesInvoiceWorkspaceApi {
    /** @return all owned invoices as detached read snapshots, before workspace pagination */
    List<Invoice> invoices();

    /**
     * Document snapshot with public UUID references and integer-cent amounts.
     * Lifecycle strings retain the owning module's enum names. Last activity is
     * supplied by the owner and is not necessarily the latest database update.
     */
    record Invoice(
            UUID id,
            UUID orderId,
            String reference,
            String status,
            String paymentStatus,
            Instant paidAt,
            Instant issuedAt,
            String customerName,
            String customerPhone,
            String customerEmail,
            String description,
            int amountCents,
            Instant lastActivity) {
    }
}
