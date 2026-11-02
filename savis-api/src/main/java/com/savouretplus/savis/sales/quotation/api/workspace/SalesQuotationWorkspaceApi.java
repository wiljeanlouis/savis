package com.savouretplus.savis.sales.quotation.api.workspace;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Read-only snapshots used by the commercial workspace. */
public interface SalesQuotationWorkspaceApi {
    List<Request> requests();

    List<Quotation> quotations();

    record Request(
            UUID id,
            String customerName,
            String customerPhone,
            String customerEmail,
            String status,
            Instant receivedAt,
            Instant lastActivity) {
    }

    record Quotation(
            UUID id,
            String reference,
            String status,
            String customerName,
            String customerPhone,
            String customerEmail,
            String description,
            int amountCents,
            Instant lastActivity,
            UUID requestId,
            UUID orderId) {
    }
}
