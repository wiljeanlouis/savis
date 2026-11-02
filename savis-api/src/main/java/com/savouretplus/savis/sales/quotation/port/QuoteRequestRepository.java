package com.savouretplus.savis.sales.quotation.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequest;

public interface QuoteRequestRepository {
    QuoteRequest save(QuoteRequest request);
    Optional<QuoteRequest> lock(UUID id);
    QuoteRequest insert(QuoteRequest request);
    Optional<QuoteRequest> find(UUID id);
    Optional<QuoteRequest> findExternal(String source, UUID externalId);
    Page list(int page, int size, String search, boolean ascending, String status);
    default Page list(int page, int size, String search, String sort, String status) {
        return list(page, size, search, "receivedAt,asc".equals(sort), status);
    }
    record Page(List<QuoteRequest> content, long totalElements, int page, int size) {}
}
