package com.savouretplus.savis.sales.invoice.api.workspace;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Read-only invoice snapshots used by the commercial workspace. */
public interface SalesInvoiceWorkspaceApi {
    List<Invoice> invoices();

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
