package com.savouretplus.savis.invoice.adapter.web;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

/** Identifies the order used to create an invoice draft. */
public record CreateInvoiceRequest(@NotNull UUID orderId) {
}
