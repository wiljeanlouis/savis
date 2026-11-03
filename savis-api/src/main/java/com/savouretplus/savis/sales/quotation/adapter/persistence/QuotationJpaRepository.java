package com.savouretplus.savis.sales.quotation.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import jakarta.persistence.LockModeType;

/** Spring Data repository for quotation entities. */
interface QuotationJpaRepository extends JpaRepository<QuotationEntity, Long> {
    Optional<QuotationEntity> findBySourceQuoteRequestIdAndProposalRequestId(UUID requestId,UUID proposalId);
    List<QuotationEntity> findBySourceQuoteRequestIdOrderByCreatedAtAscPublicIdAsc(UUID requestId);
    Optional<QuotationEntity> findByPublicId(UUID publicId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<QuotationEntity> findForUpdateByPublicId(UUID publicId);

    List<QuotationEntity> findAllByOrderByCreatedAtDesc();
}
