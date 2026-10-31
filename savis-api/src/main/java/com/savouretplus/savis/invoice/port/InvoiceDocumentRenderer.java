package com.savouretplus.savis.invoice.port;

import com.savouretplus.savis.invoice.domain.Invoice;

/** Renders an issued invoice from its persisted snapshot. */
public interface InvoiceDocumentRenderer {
    /** Returns the generated PDF bytes. */
    byte[] render(Invoice invoice);
}
