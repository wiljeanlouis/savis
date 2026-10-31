package com.savouretplus.savis.invoice.usecase;

import com.savouretplus.savis.invoice.domain.InvoiceAddress;

/** Contains the editable customer and financial values of a draft invoice. */
public record UpdateInvoiceCommand(
        String customerName,
        String customerPhone,
        String customerEmail,
        InvoiceAddress customerAddress,
        String note,
        int discountCents,
        int deliveryFeeCents,
        int gstCents,
        int qstCents) {
}
