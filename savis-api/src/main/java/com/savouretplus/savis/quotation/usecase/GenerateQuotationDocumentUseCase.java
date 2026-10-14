package com.savouretplus.savis.quotation.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.quotation.domain.Quotation;
import com.savouretplus.savis.quotation.port.QuotationDocumentRenderer;
import com.savouretplus.savis.quotation.port.QuotationRepository;

import lombok.AllArgsConstructor;

/** Generates standalone quotation documents from captured commercial data. */
@Service
@Transactional(readOnly = true)
@AllArgsConstructor
public class GenerateQuotationDocumentUseCase {
    private final QuotationRepository quotations;
    private final QuotationDocumentRenderer renderer;

    /** Generates the PDF for one quotation. */
    public GeneratedQuotationDocument generate(UUID quotationId) {
        Quotation quotation = quotations.findByPublicId(quotationId)
                .orElseThrow(() -> new QuotationNotFoundException(quotationId));
        return new GeneratedQuotationDocument(
                "soumission-%s.pdf".formatted(safe(quotation.quotationNumber())),
                renderer.render(quotation));
    }

    private String safe(String value) {
        return value.replaceAll("[^A-Za-z0-9._-]", "-");
    }
}
