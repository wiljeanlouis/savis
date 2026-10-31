package com.savouretplus.savis.sales.invoice.adapter.persistence;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.sales.invoice.domain.Invoice;
import com.savouretplus.savis.sales.invoice.domain.InvoiceAddress;
import com.savouretplus.savis.sales.invoice.port.InvoiceRepository;

import lombok.AllArgsConstructor;

/** Persists and reconstructs invoice aggregates. */
@Repository
@AllArgsConstructor
public class InvoiceRepositoryAdapter implements InvoiceRepository {
    private final InvoiceJpaRepository repository;

    @Override
    @Transactional
    public Invoice save(Invoice invoice) {
        InvoiceEntity entity = repository.findByPublicId(invoice.publicId()).orElseGet(InvoiceEntity::new);
        update(entity, invoice);
        return toDomain(repository.saveAndFlush(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Invoice> findByPublicId(UUID publicId) {
        return repository.findByPublicId(publicId).map(this::toDomain);
    }

    @Override
    @Transactional
    public Optional<Invoice> findByPublicIdForUpdate(UUID publicId) {
        return repository.findForUpdateByPublicId(publicId).map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Invoice> findBySourceOrderId(UUID sourceOrderId) {
        return repository.findBySourceOrderId(sourceOrderId).map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Invoice> findAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream().map(this::toDomain).toList();
    }

    private void update(InvoiceEntity entity, Invoice invoice) {
        entity.setPublicId(invoice.publicId());
        entity.setInvoiceNumber(invoice.invoiceNumber());
        entity.setSourceOrderId(invoice.sourceOrderId());
        entity.setSourceOrderNumber(invoice.sourceOrderNumber());
        entity.setStatus(invoice.status());
        entity.setCustomerName(invoice.customerName());
        entity.setCustomerPhone(invoice.customerPhone());
        entity.setCustomerEmail(invoice.customerEmail());
        InvoiceAddress address = invoice.customerAddress();
        entity.setCustomerAddressLine1(address == null ? null : address.line1());
        entity.setCustomerAddressLine2(address == null ? null : address.line2());
        entity.setCustomerCity(address == null ? null : address.city());
        entity.setCustomerProvince(address == null ? null : address.province());
        entity.setCustomerPostalCode(address == null ? null : address.postalCode());
        entity.setNote(invoice.note());
        entity.setSubtotalCents(invoice.subtotalCents());
        entity.setDiscountCents(invoice.discountCents());
        entity.setDeliveryFeeCents(invoice.deliveryFeeCents());
        entity.setGstCents(invoice.gstCents());
        entity.setQstCents(invoice.qstCents());
        entity.setTotalCents(invoice.totalCents());
        entity.setCreatedAt(invoice.createdAt());
        entity.setUpdatedAt(invoice.updatedAt());
        entity.setIssuedAt(invoice.issuedAt());
        entity.setCancelledAt(invoice.cancelledAt());
        entity.setItems(new ArrayList<>(invoice.items()));
    }

    private Invoice toDomain(InvoiceEntity entity) {
        InvoiceAddress address = new InvoiceAddress(
                entity.getCustomerAddressLine1(), entity.getCustomerAddressLine2(), entity.getCustomerCity(),
                entity.getCustomerProvince(), entity.getCustomerPostalCode());
        return new Invoice(
                entity.getId(), entity.getPublicId(), entity.getInvoiceNumber(), entity.getSourceOrderId(),
                entity.getSourceOrderNumber(), entity.getStatus(), entity.getCustomerName(), entity.getCustomerPhone(),
                entity.getCustomerEmail(), address.isEmpty() ? null : address, entity.getNote(),
                entity.getDiscountCents(), entity.getDeliveryFeeCents(), entity.getGstCents(), entity.getQstCents(),
                entity.getTotalCents(), entity.getCreatedAt(), entity.getUpdatedAt(), entity.getIssuedAt(),
                entity.getCancelledAt(), entity.getItems());
    }
}
