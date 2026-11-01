package com.savouretplus.savis.sales.quotation.port;

import java.util.List;
import java.util.UUID;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequest;

/** Raw rows are decoded individually, so a malformed row cannot poison a batch. */
public interface QuoteRequestInbox {
    List<String> pending(int limit);
    UUID receptionId(String row);
    QuoteRequest decode(String row);
    void acknowledge(UUID id, boolean success);
}
