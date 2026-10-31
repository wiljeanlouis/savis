package com.savouretplus.savis.sales.quotation.adapter.web;

import com.savouretplus.savis.sales.quotation.domain.QuotationStatus;

import jakarta.validation.constraints.NotNull;

/** Represents a requested quotation lifecycle transition. */
public record UpdateQuotationStatusRequest(@NotNull QuotationStatus status) {
}
