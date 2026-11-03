package com.savouretplus.savis.sales.quotation.usecase;

import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.savouretplus.savis.sales.quotation.domain.*;
import com.savouretplus.savis.sales.quotation.port.QuoteRequestRepository;
import lombok.RequiredArgsConstructor;
@Service @RequiredArgsConstructor
public class QuoteRequestService {
    private final QuoteRequestRepository requests;
    private final Clock clock;
    @Transactional public QuoteRequest qualify(UUID id,long expectedVersion,QuoteRequestQualification qualification) {
        return requests.save(require(id).qualify(expectedVersion,qualification,clock.instant()));
    }
    @Transactional public QuoteRequest status(UUID id,long expectedVersion,QuoteRequestStatus status,String reason) {
        return requests.save(require(id).changeStatus(expectedVersion,status,reason,clock.instant()));
    }
    private QuoteRequest require(UUID id) { return requests.lock(id).orElseThrow(() -> new QuoteRequestNotFoundException()); }
}
