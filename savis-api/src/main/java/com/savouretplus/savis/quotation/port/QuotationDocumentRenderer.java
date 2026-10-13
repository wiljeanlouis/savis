package com.savouretplus.savis.quotation.port;

import com.savouretplus.savis.quotation.domain.Quotation;

/** Renders a commercial quotation from its immutable snapshots. */
public interface QuotationDocumentRenderer {
    /** Renders the quotation as PDF bytes. */
    byte[] render(Quotation quotation);
}
