package com.savouretplus.savis.quotation.adapter.pdf;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import org.thymeleaf.templatemode.TemplateMode;

import com.savouretplus.savis.quotation.domain.Quotation;
import com.savouretplus.savis.quotation.domain.QuotationAddress;
import com.savouretplus.savis.quotation.domain.QuotationItem;
import com.savouretplus.savis.quotation.domain.QuotationStatus;

class OpenHtmlToPdfQuotationRendererTest {
    @Test
    void rendersQuotationNumberValiditySnapshotsAndCommercialNotes() throws Exception {
        byte[] pdf = renderer().render(quotation());

        assertTrue(new String(pdf, 0, 5).startsWith("%PDF-"));
        assertCommercialFontsAreEmbedded(pdf);
        String text = text(pdf);
        assertTrue(text.contains("SOUMISSION"));
        assertTrue(text.contains("SOU-00000042"));
        assertTrue(text.contains("30/11/2026"));
        assertTrue(text.contains("Installation personnalisée"));
        assertTrue(text.contains("Prix garanti pour cet événement"));
        assertTrue(text.contains("145,00 CAD"));
        assertFalse(text.contains("BOM"));

        Path output = Path.of("target", "test-pdfs");
        Files.createDirectories(output);
        Files.write(output.resolve("soumission-commerciale-exemple.pdf"), pdf);
    }

    private OpenHtmlToPdfQuotationRenderer renderer() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        SpringTemplateEngine templates = new SpringTemplateEngine();
        templates.setTemplateResolver(resolver);
        return new OpenHtmlToPdfQuotationRenderer(templates);
    }

    private String text(byte[] content) throws Exception {
        try (var document = Loader.loadPDF(content)) {
            return new PDFTextStripper().getText(document);
        }
    }

    private void assertCommercialFontsAreEmbedded(byte[] content) throws Exception {
        Set<String> fontNames = new HashSet<>();
        try (var document = Loader.loadPDF(content)) {
            for (var page : document.getPages()) {
                for (var key : page.getResources().getFontNames()) {
                    var font = page.getResources().getFont(key);
                    assertTrue(font.isEmbedded(), () -> "La police PDF n'est pas incorporée : " + font.getName());
                    fontNames.add(font.getName());
                }
            }
        }
        assertTrue(fontNames.stream().anyMatch(name -> name.contains("LiberationSans")));
        assertTrue(fontNames.stream().anyMatch(name -> name.contains("RobotoCondensed-Bold")));
    }

    private Quotation quotation() {
        Instant createdAt = Instant.parse("2026-10-12T15:00:00Z");
        QuotationItem item = new QuotationItem(
                null, UUID.randomUUID(), "Installation personnalisée", "SERVICE", "STANDARD", null,
                1, 15000, 15000, 15000, "service", "Service", 1, "NONE",
                List.of(), List.of(), List.of());
        return new Quotation(
                1L, UUID.randomUUID(), "SOU-00000042", QuotationStatus.DRAFT,
                "Ada Lovelace", "+15145550101", "ada@example.com",
                new QuotationAddress("123 rue Principale", null, "Montréal", "QC", "H1H 1H1"),
                LocalDate.of(2026, 11, 30), "Prix garanti pour cet événement",
                1000, 500, 14500, createdAt, createdAt,
                null, null, null, null, List.of(item));
    }
}
