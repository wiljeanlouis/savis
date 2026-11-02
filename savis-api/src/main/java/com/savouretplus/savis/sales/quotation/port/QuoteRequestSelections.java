package com.savouretplus.savis.sales.quotation.port;

import java.util.List;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequest;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequestQualification.Line;

/** Decodes public selections at the payload boundary; never imports prices. */
public interface QuoteRequestSelections {
    List<Selection> read(QuoteRequest request);
    record Selection(String needKey, String requestedName, java.util.UUID productId, Line line, String issue) {}
}
