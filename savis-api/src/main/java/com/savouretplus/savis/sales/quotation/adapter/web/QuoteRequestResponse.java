package com.savouretplus.savis.sales.quotation.adapter.web;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import com.savouretplus.savis.sales.quotation.domain.*;

/** HTTP contract exposes public UUIDs only. Payload and history are detail-only. */
public record QuoteRequestResponse(UUID publicId,String source,UUID externalId,UUID submissionRequestId,
        String customerName,String customerPhone,String customerEmail,Instant receivedAt,Instant importedAt,
        QuoteRequestStatus status,long version,String originalPayload,QuoteRequestQualification qualification,
        String closedReason,List<QuoteRequest.Change> history,Set<String> needKeys) {
    static QuoteRequestResponse from(QuoteRequest r) {
        return new QuoteRequestResponse(r.publicId(),r.source(),r.externalId(),r.submissionRequestId(),r.customerName(),
                r.customerPhone(),r.customerEmail(),r.receivedAt(),r.importedAt(),r.status(),r.version(),r.originalPayload(),
                r.qualification(),r.closedReason(),r.history(),r.needKeys());
    }
    public record Summary(UUID publicId,String customerName,Instant receivedAt,QuoteRequestStatus status,long version) {
        static Summary from(QuoteRequest r) { return new Summary(r.publicId(),r.qualification()==null?r.customerName():r.qualification().customerName(),r.receivedAt(),r.status(),r.version()); }
    }
    public record Page(List<Summary> content,long totalElements,int page,int size) {
        static Page from(com.savouretplus.savis.sales.quotation.port.QuoteRequestRepository.Page p) {
            return new Page(p.content().stream().map(Summary::from).toList(),p.totalElements(),p.page(),p.size());
        }
    }
}
