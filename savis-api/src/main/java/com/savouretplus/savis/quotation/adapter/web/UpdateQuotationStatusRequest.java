package com.savouretplus.savis.quotation.adapter.web;

import com.savouretplus.savis.quotation.domain.QuotationStatus;

import jakarta.validation.constraints.NotNull;

/** Represents a requested quotation lifecycle transition. */
public record UpdateQuotationStatusRequest(@NotNull QuotationStatus status) {
}
