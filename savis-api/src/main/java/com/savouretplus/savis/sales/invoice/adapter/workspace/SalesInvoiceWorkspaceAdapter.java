package com.savouretplus.savis.sales.invoice.adapter.workspace;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.sales.invoice.api.workspace.SalesInvoiceWorkspaceApi;
import com.savouretplus.savis.sales.invoice.port.InvoiceRepository;
import lombok.RequiredArgsConstructor;

/** Maps owned invoice aggregates to the workspace's read-only contract. */
@Component
@RequiredArgsConstructor
class SalesInvoiceWorkspaceAdapter implements SalesInvoiceWorkspaceApi {
    private final InvoiceRepository invoices;

    @Override
    public java.util.List<Invoice> invoices() {
        return invoices.findAll().stream()
                .map(invoice -> new Invoice(
                        invoice.publicId(),
                        invoice.sourceOrderId(),
                        invoice.invoiceNumber() == null
                                ? "Brouillon · " + invoice.sourceOrderNumber()
                                : invoice.invoiceNumber(),
                        invoice.status().name(),
                        invoice.customerName(),
                        invoice.customerPhone(),
                        invoice.customerEmail(),
                        invoice.note(),
                        invoice.totalCents(),
                        invoice.updatedAt()))
                .toList();
    }
}
