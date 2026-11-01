package com.savouretplus.savis.sales.quotation.adapter.persistence;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.sales.quotation.domain.Quotation;
import com.savouretplus.savis.sales.quotation.domain.QuotationAddress;
import com.savouretplus.savis.sales.quotation.port.QuotationRepository;

import lombok.AllArgsConstructor;

/** Persists and reconstructs quotation aggregates. */
@Repository
@AllArgsConstructor
public class QuotationRepositoryAdapter implements QuotationRepository {
    private final QuotationJpaRepository repository;

    @Override @Transactional(readOnly=true)
    public Optional<Proposal> findProposal(UUID sourceId,UUID proposalId) {
        return repository.findBySourceQuoteRequestIdAndProposalRequestId(sourceId,proposalId)
                .map(e -> new Proposal(toDomain(e),e.getProposalFingerprint()));
    }
    @Override @Transactional
    public Quotation attachSource(UUID quotationId,UUID sourceId,UUID proposalId,String fingerprint,java.util.Map<String,String> exclusions) {
        var entity=repository.findForUpdateByPublicId(quotationId).orElseThrow();
        if(entity.getSourceQuoteRequestId()!=null) throw new IllegalStateException("Origine déjà définie");
        entity.setSourceQuoteRequestId(sourceId);entity.setProposalRequestId(proposalId);entity.setProposalFingerprint(fingerprint);entity.setProposalExclusions(exclusions);
        return toDomain(repository.saveAndFlush(entity));
    }
    @Override @Transactional(readOnly=true)
    public List<Quotation> findBySource(UUID sourceId) {
        return repository.findBySourceQuoteRequestIdOrderByCreatedAtAscPublicIdAsc(sourceId).stream().map(this::toDomain).toList();
    }
    @Override
    @Transactional
    public Quotation save(Quotation quotation) {
        QuotationEntity entity = repository.findByPublicId(quotation.publicId()).orElseGet(QuotationEntity::new);
        update(entity, quotation);
        return toDomain(repository.saveAndFlush(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Quotation> findByPublicId(UUID publicId) {
        return repository.findByPublicId(publicId).map(this::toDomain);
    }

    @Override
    @Transactional
    public Optional<Quotation> findByPublicIdForUpdate(UUID publicId) {
        return repository.findForUpdateByPublicId(publicId).map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Quotation> findAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream().map(this::toDomain).toList();
    }

    private void update(QuotationEntity entity, Quotation quotation) {
        entity.setPublicId(quotation.publicId());
        entity.setQuotationNumber(quotation.quotationNumber());
        entity.setStatus(quotation.status());
        entity.setCustomerName(quotation.customerName());
        entity.setCustomerPhone(quotation.customerPhone());
        entity.setCustomerEmail(quotation.customerEmail());
        QuotationAddress address = quotation.customerAddress();
        entity.setCustomerAddressLine1(address == null ? null : address.line1());
        entity.setCustomerAddressLine2(address == null ? null : address.line2());
        entity.setCustomerCity(address == null ? null : address.city());
        entity.setCustomerProvince(address == null ? null : address.province());
        entity.setCustomerPostalCode(address == null ? null : address.postalCode());
        entity.setValidUntil(quotation.validUntil());
        entity.setNote(quotation.note());
        entity.setDiscountCents(quotation.discountCents());
        entity.setDeliveryFeeCents(quotation.deliveryFeeCents());
        entity.setTotalCents(quotation.totalCents());
        entity.setCreatedAt(quotation.createdAt());
        entity.setUpdatedAt(quotation.updatedAt());
        entity.setSentAt(quotation.sentAt());
        entity.setAcceptedAt(quotation.acceptedAt());
        entity.setRejectedAt(quotation.rejectedAt());
        entity.setConvertedOrderId(quotation.convertedOrderId());
        entity.setItems(new ArrayList<>(quotation.items()));
    }

    private Quotation toDomain(QuotationEntity entity) {
        QuotationAddress address = new QuotationAddress(
                entity.getCustomerAddressLine1(), entity.getCustomerAddressLine2(), entity.getCustomerCity(),
                entity.getCustomerProvince(), entity.getCustomerPostalCode());
        return new Quotation(
                entity.getId(), entity.getPublicId(), entity.getQuotationNumber(), entity.getStatus(),
                entity.getCustomerName(), entity.getCustomerPhone(), entity.getCustomerEmail(),
                address.isEmpty() ? null : address, entity.getValidUntil(), entity.getNote(),
                entity.getDiscountCents(), entity.getDeliveryFeeCents(), entity.getTotalCents(),
                entity.getCreatedAt(), entity.getUpdatedAt(), entity.getSentAt(), entity.getAcceptedAt(),
                entity.getRejectedAt(), entity.getConvertedOrderId(), entity.getItems(), entity.getSourceQuoteRequestId());
    }
}
