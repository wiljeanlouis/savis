package com.savouretplus.savis.order.adapter.pdf;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import org.thymeleaf.templatemode.TemplateMode;

import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderAddress;
import com.savouretplus.savis.order.domain.OrderItem;
import com.savouretplus.savis.order.domain.OrderItemAllocationType;
import com.savouretplus.savis.order.domain.OrderItemProductType;
import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.domain.OrderStatus;
import com.savouretplus.savis.order.usecase.OrderDocumentType;

class OpenHtmlToPdfOrderDocumentRendererTest {
    private static final Instant GENERATED_AT = Instant.parse("2026-10-12T14:00:00Z");

    @Test
    void rendersInvoiceAndQuoteWithOrderSnapshotAndAdjustments() throws Exception {
        OpenHtmlToPdfOrderDocumentRenderer renderer = renderer();

        byte[] invoice = renderer.render(order(), OrderDocumentType.INVOICE, GENERATED_AT);
        byte[] quote = renderer.render(order(), OrderDocumentType.QUOTE, GENERATED_AT);

        assertTrue(new String(invoice, 0, 5).startsWith("%PDF-"));
        String invoiceText = text(invoice);
        assertTrue(invoiceText.contains("FACTURE"));
        assertTrue(invoiceText.contains("ADM-00000042"));
        assertTrue(invoiceText.contains("Ada Lovelace"));
        assertTrue(invoiceText.contains("Rabais"));
        assertTrue(invoiceText.contains("Frais de livraison"));
        assertTrue(invoiceText.contains("26,00 CAD"));

        String quoteText = text(quote);
        assertTrue(quoteText.contains("SOUMISSION"));
        assertTrue(quoteText.contains("11/11/2026"));
        assertTrue(quoteText.contains("SIGNATURE DU CLIENT"));

        Path output = Path.of("target", "test-pdfs");
        Files.createDirectories(output);
        Files.write(output.resolve("facture-exemple.pdf"), invoice);
        Files.write(output.resolve("soumission-exemple.pdf"), quote);
    }

    private OpenHtmlToPdfOrderDocumentRenderer renderer() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        SpringTemplateEngine templates = new SpringTemplateEngine();
        templates.setTemplateResolver(resolver);
        return new OpenHtmlToPdfOrderDocumentRenderer(templates);
    }

    private String text(byte[] content) throws Exception {
        try (var document = Loader.loadPDF(content)) {
            return new PDFTextStripper().getText(document);
        }
    }

    private Order order() {
        OrderItem item = new OrderItem(
                null,
                UUID.fromString("20000000-0000-4000-8000-000000000002"),
                UUID.fromString("30000000-0000-4000-8000-000000000003"),
                "Boîte de cupcakes",
                OrderItemProductType.STANDARD,
                null,
                2,
                1200,
                1200,
                2400,
                "box",
                "Boîte",
                6,
                OrderItemAllocationType.NONE,
                null,
                List.of(),
                List.of(),
                List.of());
        return new Order(
                1L,
                UUID.fromString("10000000-0000-4000-8000-000000000001"),
                "ADM-00000042",
                OrderSource.ADMIN,
                OrderStatus.NEW,
                "Ada Lovelace",
                "514 555-0101",
                "ada@example.com",
                new OrderAddress("123 rue Principale", null, "Montréal", "QC", "H1H 1H1"),
                null,
                200,
                400,
                2600,
                null,
                GENERATED_AT,
                GENERATED_AT,
                null, null, null, null, null,
                List.of(item),
                Map.of());
    }
}
