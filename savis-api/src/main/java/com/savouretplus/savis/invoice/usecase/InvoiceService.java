package com.savouretplus.savis.invoice.usecase;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.invoice.domain.Invoice;
import com.savouretplus.savis.invoice.domain.InvoiceAddress;
import com.savouretplus.savis.invoice.domain.InvoiceItem;
import com.savouretplus.savis.invoice.domain.InvoiceStatus;
import com.savouretplus.savis.invoice.port.InvoiceNumberGenerator;
import com.savouretplus.savis.invoice.port.InvoiceRepository;
import com.savouretplus.savis.order.api.OrderInvoicingApi;

import lombok.AllArgsConstructor;

/** Coordinates invoice creation, draft editing and irreversible lifecycle transitions. */
@Service
@AllArgsConstructor
public class InvoiceService {
    private final InvoiceRepository invoices;
    private final InvoiceNumberGenerator numbers;
    private final OrderInvoicingApi orders;
    private final Clock clock;

    /** Creates one draft invoice per eligible order, or returns the existing invoice. */
    @Transactional
    public Invoice createFromOrder(UUID orderId) {
        OrderInvoicingApi.OrderSnapshot order = orders.snapshotForInvoice(orderId);
        return invoices.findBySourceOrderId(order.orderId()).orElseGet(() -> create(order));
    }

    /** Returns all invoices, optionally filtered by lifecycle status. */
    @Transactional(readOnly = true)
    public List<Invoice> list(InvoiceStatus status) {
        return invoices.findAll().stream()
                .filter(invoice -> status == null || invoice.status() == status)
                .toList();
    }

    /** Returns one invoice. */
    @Transactional(readOnly = true)
    public Invoice get(UUID invoiceId) {
        return invoices.findByPublicId(invoiceId).orElseThrow(() -> new InvoiceNotFoundException(invoiceId));
    }

    /** Updates customer details and financial adjustments while the invoice remains a draft. */
    @Transactional
    public Invoice update(UUID invoiceId, UpdateInvoiceCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("Les modifications de la facture sont requises");
        }
        Invoice current = requireForUpdate(invoiceId);
        return invoices.save(current.updateDraft(
                command.customerName(),
                InvoiceContactNormalizer.phone(command.customerPhone()),
                blank(command.customerEmail()),
                InvoiceContactNormalizer.address(command.customerAddress()),
                blank(command.note()),
                command.discountCents(),
                command.deliveryFeeCents(),
                command.gstCents(),
                command.qstCents(),
                clock.instant()));
    }

    /** Issues a draft once and assigns its durable invoice number. */
    @Transactional
    public Invoice issue(UUID invoiceId) {
        Invoice current = requireForUpdate(invoiceId);
        if (current.status() == InvoiceStatus.ISSUED) {
            return current;
        }
        return invoices.save(current.issue(numbers.next(), clock.instant()));
    }

    /** Cancels a draft or issued invoice without creating a credit note. */
    @Transactional
    public Invoice cancel(UUID invoiceId) {
        return invoices.save(requireForUpdate(invoiceId).cancel(clock.instant()));
    }

    private Invoice create(OrderInvoicingApi.OrderSnapshot order) {
        Instant now = clock.instant();
        InvoiceAddress address = order.address() == null ? null : new InvoiceAddress(
                order.address().line1(), order.address().line2(), order.address().city(),
                order.address().province(), order.address().postalCode());
        return invoices.save(new Invoice(
                null, null, null, order.orderId(), order.orderNumber(), InvoiceStatus.DRAFT,
                order.customerName(), order.customerPhone(), order.customerEmail(), address, order.note(),
                order.discountCents(), order.deliveryFeeCents(), 0, 0, order.totalCents(),
                now, now, null, null, order.items().stream().map(this::item).toList()));
    }

    private InvoiceItem item(OrderInvoicingApi.Item item) {
        return new InvoiceItem(
                null, item.itemId(), item.productId(), item.productName(), item.productType(), item.imageUrl(),
                item.quantity(), item.basePriceCents(), item.unitPriceCents(), item.lineTotalCents(),
                item.purchaseModeId(), item.purchaseModeLabel(), item.purchaseModeQuantity(), item.allocationType(),
                item.choices().stream().map(value -> new InvoiceItem.Choice(
                        value.id(), value.name(), value.groupLabel())).toList(),
                item.allocations().stream().map(value -> new InvoiceItem.Allocation(
                        value.id(), value.name(), value.quantity())).toList(),
                item.ingredients().stream().map(value -> new InvoiceItem.Ingredient(
                        value.id(), value.name(), value.quantity(), value.defaultQuantity(),
                        value.extraPriceCents())).toList());
    }

    private Invoice requireForUpdate(UUID invoiceId) {
        return invoices.findByPublicIdForUpdate(invoiceId)
                .orElseThrow(() -> new InvoiceNotFoundException(invoiceId));
    }

    private String blank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
