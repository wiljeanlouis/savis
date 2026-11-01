package com.savouretplus.savis.sales.quotation.adapter.persistence;

import com.savouretplus.savis.sales.quotation.domain.QuoteRequestConflictException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequest;
import com.savouretplus.savis.sales.quotation.port.QuoteRequestRepository;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class QuoteRequestRepositoryAdapter implements QuoteRequestRepository {
    private final QuoteRequestJpaRepository repository;

    @Override
    @Transactional
    public QuoteRequest insert(QuoteRequest request) {
        var entity = new QuoteRequestEntity();
        entity.setPublicId(request.publicId());
        entity.setSource(request.source());
        entity.setExternalId(request.externalId());
        entity.setSubmissionRequestId(request.submissionRequestId());
        entity.setFingerprint(request.fingerprint());
        entity.setOriginalPayload(request.originalPayload());
        entity.setCustomerName(request.customerName());
        entity.setCustomerPhone(request.customerPhone());
        entity.setCustomerEmail(request.customerEmail());
        entity.setReceivedAt(request.receivedAt());
        entity.setImportedAt(request.importedAt());
        entity.setStatus(request.status());
        entity.setNeedKeys(request.needKeys());
        return domain(repository.saveAndFlush(entity));
    }

    @Override
    @Transactional
    public QuoteRequest save(QuoteRequest request) {
        var entity = repository.findForUpdateByPublicId(request.publicId()).orElseThrow();
        if (entity.getVersion() != request.version())
            throw new QuoteRequestConflictException("Version de demande périmée");
        entity.setStatus(request.status());
        entity.setQualification(request.qualification());
        entity.setClosedReason(request.closedReason());
        entity.setHistory(new java.util.ArrayList<>(request.history()));
        return domain(repository.saveAndFlush(entity));
    }

    @Override
    @Transactional
    public Optional<QuoteRequest> lock(UUID id) {
        return repository.findForUpdateByPublicId(id).map(this::domain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<QuoteRequest> find(UUID id) {
        return repository.findByPublicId(id).map(this::domain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<QuoteRequest> findExternal(String source, UUID id) {
        return repository.findBySourceAndExternalId(source, id).map(this::domain);
    }

    @Override
    @Transactional(readOnly = true)
    public Page list(int page, int size, String search, boolean ascending, String status) {
        Sort.Direction direction = ascending ? Sort.Direction.ASC : Sort.Direction.DESC;
        var result = repository.findAll(
                (r, q, b) -> (search == null || search.isBlank()) && (status == null || status.isBlank())
                        ? b.conjunction()
                        : b.and(status == null || status.isBlank() ? b.conjunction()
                                : b.equal(r.get("status"),
                                        com.savouretplus.savis.sales.quotation.domain.QuoteRequestStatus
                                                .valueOf(status)),
                                b.like(b.lower(r.get("customerName")),
                                        "%" + escape(search.toLowerCase(java.util.Locale.ROOT)) + "%", '\\')),
                PageRequest.of(page, size, Sort.by(direction, "receivedAt", "publicId")));
        return new Page(result.getContent().stream().map(this::domain).toList(), result.getTotalElements(), page, size);
    }

    private String escape(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private QuoteRequest domain(QuoteRequestEntity e) {
        return new QuoteRequest(e.getId(), e.getPublicId(), e.getSource(), e.getExternalId(),
                e.getSubmissionRequestId(),
                e.getFingerprint(), e.getOriginalPayload(), e.getCustomerName(), e.getCustomerPhone(),
                e.getCustomerEmail(),
                e.getReceivedAt(), e.getImportedAt(), e.getStatus(), e.getVersion(), e.getQualification(),
                e.getClosedReason(), e.getHistory(), e.getNeedKeys());
    }
}
