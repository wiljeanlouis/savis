package com.savouretplus.savis.sales.quotation.adapter.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

interface QuoteRequestJpaRepository extends JpaRepository<QuoteRequestEntity, Long>, JpaSpecificationExecutor<QuoteRequestEntity> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    Optional<QuoteRequestEntity> findForUpdateByPublicId(UUID id);
    Optional<QuoteRequestEntity> findByPublicId(UUID id);
    Optional<QuoteRequestEntity> findBySourceAndExternalId(String source, UUID externalId);
}
