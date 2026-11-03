package com.savouretplus.savis.sales.invoice.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import jakarta.persistence.LockModeType;

/** Spring Data repository for invoice entities. */
interface InvoiceJpaRepository extends JpaRepository<InvoiceEntity, Long> {
    Optional<InvoiceEntity> findByPublicId(UUID publicId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<InvoiceEntity> findForUpdateByPublicId(UUID publicId);

    Optional<InvoiceEntity> findBySourceOrderId(UUID sourceOrderId);

    List<InvoiceEntity> findAllByOrderByCreatedAtDesc();
}
