package com.savouretplus.savis.sales.invoice.adapter.web;

import com.savouretplus.savis.sales.invoice.domain.InvoiceAddress;
import com.savouretplus.savis.sales.invoice.usecase.UpdateInvoiceCommand;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

/** Represents the editable content of a draft invoice. */
public record UpdateInvoiceRequest(
        @NotBlank String customerName,
        @NotBlank String customerPhone,
        @Email String customerEmail,
        @Valid AddressRequest customerAddress,
        String note,
        @PositiveOrZero int discountCents,
        @PositiveOrZero int deliveryFeeCents,
        @PositiveOrZero int gstCents,
        @PositiveOrZero int qstCents) {

    /** Converts the HTTP payload to an application command. */
    UpdateInvoiceCommand toCommand() {
        return new UpdateInvoiceCommand(
                customerName, customerPhone, customerEmail,
                customerAddress == null ? null : customerAddress.toDomain(), note,
                discountCents, deliveryFeeCents, gstCents, qstCents);
    }

    /** Represents an optional structured customer address. */
    public record AddressRequest(String line1, String line2, String city, String province, String postalCode) {
        private InvoiceAddress toDomain() {
            InvoiceAddress address = new InvoiceAddress(line1, line2, city, province, postalCode);
            return address.isEmpty() ? null : address;
        }
    }
}
