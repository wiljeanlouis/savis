package com.savouretplus.savis.invoice.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.invoice.domain.Invoice;

/** Defines persistence operations for invoice aggregates. */
public interface InvoiceRepository {
    /** Persists an invoice and returns its stored representation. */
    Invoice save(Invoice invoice);

    /** Finds an invoice by its public identifier. */
    Optional<Invoice> findByPublicId(UUID publicId);

    /** Finds and locks an invoice for a lifecycle operation. */
    Optional<Invoice> findByPublicIdForUpdate(UUID publicId);

    /** Finds the single invoice associated with an order. */
    Optional<Invoice> findBySourceOrderId(UUID sourceOrderId);

    /** Lists invoices from newest to oldest. */
    List<Invoice> findAll();
}
