package com.savouretplus.savis.sales.invoice.adapter.pdf;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
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

import com.savouretplus.savis.sales.invoice.domain.Invoice;
import com.savouretplus.savis.sales.invoice.domain.InvoiceAddress;
import com.savouretplus.savis.sales.invoice.domain.InvoiceItem;
import com.savouretplus.savis.sales.invoice.domain.InvoiceStatus;

class OpenHtmlToPdfInvoiceRendererTest {
    @Test
    void rendersIssuedInvoiceNumberOrderReferenceTaxesAndPersistedSnapshots() throws Exception {
        byte[] pdf = renderer().render(invoice());

        assertTrue(new String(pdf, 0, 5).startsWith("%PDF-"));
        assertCommercialFontsAreEmbedded(pdf);
        String text = text(pdf);
        assertTrue(text.contains("FACTURE"));
        assertTrue(text.contains("FAC-00000042"));
        assertTrue(text.contains("ADM-00000012"));
        assertTrue(text.contains("TPS"));
        assertTrue(text.contains("TVQ"));
        assertTrue(text.contains("Installation personnalisée"));
        assertTrue(text.contains("145,15 CAD"));
        assertFalse(text.contains("BOM"));

        Path output = Path.of("target", "test-pdfs");
        Files.createDirectories(output);
        Files.write(output.resolve("facture-metier-exemple.pdf"), pdf);
    }

    private OpenHtmlToPdfInvoiceRenderer renderer() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        SpringTemplateEngine templates = new SpringTemplateEngine();
        templates.setTemplateResolver(resolver);
        return new OpenHtmlToPdfInvoiceRenderer(templates);
    }

    private String text(byte[] content) throws Exception {
        try (var document = Loader.loadPDF(content)) {
            return new PDFTextStripper().getText(document);
        }
    }

    private void assertCommercialFontsAreEmbedded(byte[] content) throws Exception {
        Set<String> names = new HashSet<>();
        try (var document = Loader.loadPDF(content)) {
            for (var page : document.getPages()) {
                for (var key : page.getResources().getFontNames()) {
                    var font = page.getResources().getFont(key);
                    assertTrue(font.isEmbedded(), () -> "La police PDF n'est pas incorporée : " + font.getName());
                    names.add(font.getName());
                }
            }
        }
        assertTrue(names.stream().anyMatch(name -> name.contains("LiberationSans")));
        assertTrue(names.stream().anyMatch(name -> name.contains("RobotoCondensed-Bold")));
    }

    private Invoice invoice() {
        Instant createdAt = Instant.parse("2026-10-12T15:00:00Z");
        Instant issuedAt = Instant.parse("2026-10-13T15:00:00Z");
        InvoiceItem item = new InvoiceItem(
                null, UUID.randomUUID(), UUID.randomUUID(), "Installation personnalisée", "STANDARD", null,
                1, 15000, 15000, 15000, "service", "Service", 1, "NONE",
                List.of(), List.of(), List.of());
        return new Invoice(
                1L, UUID.randomUUID(), "FAC-00000042", UUID.randomUUID(), "ADM-00000012",
                InvoiceStatus.ISSUED, "Ada Lovelace", "+15145550101", "ada@example.com",
                new InvoiceAddress("123 rue Principale", null, "Montréal", "QC", "H1H 1H1"),
                "Prix accepté", 1000, 500, 10, 5, 14515,
                createdAt, issuedAt, issuedAt, null, List.of(item));
    }
}
