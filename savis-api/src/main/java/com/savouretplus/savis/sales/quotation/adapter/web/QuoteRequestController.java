package com.savouretplus.savis.sales.quotation.adapter.web;

import com.savouretplus.savis.sales.quotation.domain.QuoteRequestValidationException;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.savouretplus.savis.sales.quotation.port.QuotationRepository;
import com.savouretplus.savis.sales.quotation.port.QuoteRequestRepository;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequest;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequestQualification;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequestStatus;
import com.savouretplus.savis.sales.quotation.usecase.CreateQuoteRequestProposal;
import com.savouretplus.savis.sales.quotation.usecase.ImportQuoteRequests;
import com.savouretplus.savis.sales.quotation.usecase.QuoteRequestService;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/** Disabled until the operator has secured the internal access path. */
@RestController
@RequestMapping("/api/quote-requests")
@RequiredArgsConstructor
public class QuoteRequestController {
    @ModelAttribute
    void preventCaching(HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
    }

    private final QuoteRequestRepository repository;
    private final ImportQuoteRequests importer;
    private final CreateQuoteRequestProposal proposals;
    private final QuotationRepository quotations;
    private final QuoteRequestService service;

    @GetMapping("/{id}/quotations")
    public java.util.List<QuotationResponse> quotations(@PathVariable UUID id) {
        if (repository.find(id).isEmpty())
            throw new com.savouretplus.savis.sales.quotation.usecase.QuoteRequestNotFoundException();
        return quotations.findBySource(id).stream().map(QuotationResponse::from).toList();
    }

    @PostMapping("/{id}/quotations")
    public QuotationResponse createProposal(@PathVariable UUID id,
            @RequestBody com.savouretplus.savis.sales.quotation.usecase.CreateQuoteRequestProposal.Command command) {
        return QuotationResponse.from(proposals.execute(id, command));
    }

    @PutMapping("/{id}/qualification")
    public QuoteRequestResponse qualify(@PathVariable UUID id, @RequestBody QualificationRequest command) {
        if (command.qualification() == null)
            throw new QuoteRequestValidationException("Les informations de qualification sont requises");
        if (command.expectedVersion() == null || command.expectedVersion() < 0)
            throw new QuoteRequestValidationException("La version attendue de la demande est requise");
        return QuoteRequestResponse.from(service.qualify(id, command.expectedVersion(), command.qualification()));
    }

    @PutMapping("/{id}/status")
    public QuoteRequestResponse status(@PathVariable UUID id, @RequestBody StatusRequest command) {
        if (command.expectedVersion() == null || command.expectedVersion() < 0)
            throw new QuoteRequestValidationException("La version attendue de la demande est requise");
        return QuoteRequestResponse
                .from(service.status(id, command.expectedVersion(), command.status(), command.reason()));
    }

    public record QualificationRequest(Long expectedVersion, QuoteRequestQualification qualification) {
    }

    public record StatusRequest(Long expectedVersion, QuoteRequestStatus status, String reason) {
    }

    @PostMapping("/import")
    public ImportQuoteRequests.Result importRequests() {
        return importer.execute();
    }

    @GetMapping
    public ResponseEntity<QuoteRequestResponse.Page> list(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "") String search, @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "receivedAt,desc") String sort) {
        if (page < 0 || page > 100000 || size < 1 || size > 100 || search.length() > 200
                || !(sort.equals("receivedAt,desc") || sort.equals("receivedAt,asc")))
            throw new QuoteRequestValidationException("Pagination ou tri invalide");
        if (!status.isBlank())
            QuoteRequestStatus.valueOf(status);
        return ResponseEntity.ok().cacheControl(org.springframework.http.CacheControl.noStore())
                .body(QuoteRequestResponse.Page
                        .from(repository.list(page, size, search, sort.endsWith("asc"), status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuoteRequestResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok().cacheControl(org.springframework.http.CacheControl.noStore())
                .body(QuoteRequestResponse.from(repository.find(id)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Demande introuvable"))));
    }
}
