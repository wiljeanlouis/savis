package com.savouretplus.savis.sales.quotation.adapter.workspace;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.sales.quotation.api.workspace.SalesQuotationWorkspaceApi;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequest;
import com.savouretplus.savis.sales.quotation.port.QuoteRequestRepository;
import com.savouretplus.savis.sales.quotation.port.QuotationRepository;
import lombok.RequiredArgsConstructor;

/** Maps owned quotation aggregates to the workspace's read-only contract. */
@Component
@RequiredArgsConstructor
class SalesQuotationWorkspaceAdapter implements SalesQuotationWorkspaceApi {
    private static final int BATCH_SIZE = 100;

    private final QuoteRequestRepository requests;
    private final QuotationRepository quotations;

    @Override
    public List<Request> requests() {
        List<Request> result = new ArrayList<>();
        for (int page = 0; ; page++) {
            var batch = requests.list(page, BATCH_SIZE, "", false, "").content();
            batch.stream().map(request -> new Request(
                    request.publicId(),
                    request.customerName(),
                    request.customerPhone(),
                    request.customerEmail(),
                    request.status().name(),
                    request.receivedAt(),
                    latestActivity(request))).forEach(result::add);
            if (batch.size() < BATCH_SIZE) {
                return List.copyOf(result);
            }
        }
    }

    @Override
    public List<Quotation> quotations() {
        return quotations.findAll().stream()
                .map(quotation -> new Quotation(
                        quotation.publicId(),
                        quotation.quotationNumber(),
                        quotation.status().name(),
                        quotation.customerName(),
                        quotation.customerPhone(),
                        quotation.customerEmail(),
                        quotation.note(),
                        quotation.totalCents(),
                        quotation.updatedAt(),
                        quotation.sourceQuoteRequestId(),
                        quotation.convertedOrderId()))
                .toList();
    }

    private Instant latestActivity(QuoteRequest request) {
        return java.util.stream.Stream.concat(
                        java.util.stream.Stream.of(request.receivedAt(), request.importedAt()),
                        request.history().stream()
                                .map(QuoteRequest.Change::at))
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);
    }
}
