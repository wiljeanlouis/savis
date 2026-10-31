package com.savouretplus.savis.sales.quotation.adapter.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.savouretplus.savis.sales.quotation.usecase.GenerateQuotationDocumentUseCase;
import com.savouretplus.savis.sales.quotation.usecase.GeneratedQuotationDocument;
import com.savouretplus.savis.sales.quotation.usecase.QuotationService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

/** Exposes quotation creation, consultation, lifecycle and conversion endpoints. */
@RestController
@RequestMapping("/api/quotations")
@AllArgsConstructor
public class QuotationController {
    private final QuotationService quotations;
    private final GenerateQuotationDocumentUseCase documents;

    /** Creates a draft quotation from current catalog data. */
    @PostMapping
    public QuotationResponse create(@Valid @RequestBody SaveQuotationRequest request) {
        return QuotationResponse.from(quotations.create(request.toCommand()));
    }

    /** Lists quotations from newest to oldest. */
    @GetMapping
    public List<QuotationResponse> list() {
        return quotations.list().stream().map(QuotationResponse::from).toList();
    }

    /** Returns one quotation with all product snapshots. */
    @GetMapping("/{quotationId}")
    public QuotationResponse get(@PathVariable UUID quotationId) {
        return QuotationResponse.from(quotations.get(quotationId));
    }

    /** Replaces the editable content of a draft quotation. */
    @PutMapping("/{quotationId}")
    public QuotationResponse update(
            @PathVariable UUID quotationId,
            @Valid @RequestBody SaveQuotationRequest request) {
        return QuotationResponse.from(quotations.update(quotationId, request.toCommand()));
    }

    /** Applies an allowed quotation status transition. */
    @PutMapping("/{quotationId}/status")
    public QuotationResponse updateStatus(
            @PathVariable UUID quotationId,
            @Valid @RequestBody UpdateQuotationStatusRequest request) {
        return QuotationResponse.from(quotations.changeStatus(quotationId, request.status()));
    }

    /** Converts an accepted quotation into exactly one order. */
    @PostMapping("/{quotationId}/convert")
    public ConversionResponse convert(@PathVariable UUID quotationId) {
        return new ConversionResponse(quotations.convert(quotationId));
    }

    /** Generates the standalone quotation PDF from its captured commercial data. */
    @GetMapping(value = "/{quotationId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> document(@PathVariable UUID quotationId) {
        GeneratedQuotationDocument document = documents.generate(quotationId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(document.fileName()).build().toString())
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.APPLICATION_PDF)
                .body(document.content());
    }

    /** Identifies the order produced by an idempotent conversion. */
    public record ConversionResponse(UUID orderId) {
    }
}
