package com.savouretplus.savis.sales.quotation.port;

import com.savouretplus.savis.sales.quotation.domain.Quotation;

/** Renders a commercial quotation from its immutable snapshots. */
public interface QuotationDocumentRenderer {
    /** Renders the quotation as PDF bytes. */
    byte[] render(Quotation quotation);
}
