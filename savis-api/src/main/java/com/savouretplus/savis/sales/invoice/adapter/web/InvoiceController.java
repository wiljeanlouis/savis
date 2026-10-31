package com.savouretplus.savis.sales.invoice.adapter.web;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.savouretplus.savis.sales.invoice.domain.InvoiceStatus;
import com.savouretplus.savis.sales.invoice.usecase.GenerateInvoiceDocumentUseCase;
import com.savouretplus.savis.sales.invoice.usecase.GeneratedInvoiceDocument;
import com.savouretplus.savis.sales.invoice.usecase.InvoiceService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

/** Exposes invoice creation, consultation, lifecycle and PDF endpoints. */
@RestController
@RequestMapping("/api/invoices")
@AllArgsConstructor
public class InvoiceController {
    private final InvoiceService invoices;
    private final GenerateInvoiceDocumentUseCase documents;

    /** Creates an idempotent draft from an eligible order snapshot. */
    @PostMapping
    public InvoiceResponse create(@Valid @RequestBody CreateInvoiceRequest request) {
        return InvoiceResponse.from(invoices.createFromOrder(request.orderId()));
    }

    /** Lists invoices, optionally filtered by status. */
    @GetMapping
    public List<InvoiceResponse> list(@RequestParam(required = false) InvoiceStatus status) {
        return invoices.list(status).stream().map(InvoiceResponse::from).toList();
    }

    /** Returns one invoice and all its captured lines. */
    @GetMapping("/{invoiceId}")
    public InvoiceResponse get(@PathVariable UUID invoiceId) {
        return InvoiceResponse.from(invoices.get(invoiceId));
    }

    /** Replaces the editable customer and adjustment fields of a draft. */
    @PutMapping("/{invoiceId}")
    public InvoiceResponse update(
            @PathVariable UUID invoiceId,
            @Valid @RequestBody UpdateInvoiceRequest request) {
        return InvoiceResponse.from(invoices.update(invoiceId, request.toCommand()));
    }

    /** Issues a draft and assigns its final number. */
    @PostMapping("/{invoiceId}/issue")
    public InvoiceResponse issue(@PathVariable UUID invoiceId) {
        return InvoiceResponse.from(invoices.issue(invoiceId));
    }

    /** Cancels a draft or issued invoice without creating a credit note. */
    @PostMapping("/{invoiceId}/cancel")
    public InvoiceResponse cancel(@PathVariable UUID invoiceId) {
        return InvoiceResponse.from(invoices.cancel(invoiceId));
    }

    /** Downloads the final PDF generated from the persisted invoice snapshot. */
    @GetMapping(value = "/{invoiceId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> document(@PathVariable UUID invoiceId) {
        GeneratedInvoiceDocument document = documents.generate(invoiceId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(document.fileName()).build().toString())
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.APPLICATION_PDF)
                .body(document.content());
    }
}
