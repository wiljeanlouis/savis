package com.savouretplus.savis.sales.quotation.adapter.pdf;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.savouretplus.savis.common.pdf.CommercialPdfFonts;
import com.savouretplus.savis.sales.quotation.domain.Quotation;
import com.savouretplus.savis.sales.quotation.domain.QuotationContactNormalizer;
import com.savouretplus.savis.sales.quotation.domain.QuotationItem;
import com.savouretplus.savis.sales.quotation.port.QuotationDocumentRenderer;

import lombok.AllArgsConstructor;

/** Renders a standalone quotation with the shared commercial-document design. */
@Component
@AllArgsConstructor
public class OpenHtmlToPdfQuotationRenderer implements QuotationDocumentRenderer {
    private static final Locale LOCALE = Locale.CANADA_FRENCH;
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Toronto");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy", LOCALE);
    private static final String LOGO_PATH = "templates/brand/savour_et_plus_logo.png";

    private final SpringTemplateEngine templates;

    /** Produces a letter-sized PDF using only the accepted commercial snapshots. */
    @Override
    public byte[] render(Quotation quotation) {
        Context context = new Context(LOCALE);
        context.setVariable("quote", true);
        context.setVariable("title", "SOUMISSION");
        context.setVariable("documentDate", DATE_FORMAT.format(
                quotation.createdAt().atZone(BUSINESS_ZONE).toLocalDate()));
        context.setVariable("validUntil", DATE_FORMAT.format(quotation.validUntil()));
        context.setVariable("referenceLabel", "SOUMISSION");
        context.setVariable("referenceNumber", quotation.quotationNumber());
        context.setVariable("hasSourceReference", false);
        context.setVariable("cancelled", false);
        context.setVariable("logoDataUri", logoDataUri());
        context.setVariable("issuer", issuer());
        context.setVariable("customer", customer(quotation));
        context.setVariable("items", quotation.items().stream().map(this::item).toList());
        context.setVariable("subtotal", money(quotation.subtotalCents()));
        context.setVariable("discount", money(quotation.discountCents()));
        context.setVariable("hasDiscount", quotation.discountCents() > 0);
        context.setVariable("deliveryFee", money(quotation.deliveryFeeCents()));
        context.setVariable("hasDeliveryFee", quotation.deliveryFeeCents() > 0);
        context.setVariable("hasGst", false);
        context.setVariable("hasQst", false);
        context.setVariable("total", money(quotation.totalCents()));
        context.setVariable("note", quotation.note());
        context.setVariable("hasNote", quotation.note() != null && !quotation.note().isBlank());

        String html = templates.process("order/order-document", context);
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = CommercialPdfFonts.registerOn(new PdfRendererBuilder());
            builder.useFastMode().withHtmlContent(html, null).toStream(output).run();
            return output.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Impossible de générer la soumission PDF", exception);
        }
    }

    private PartyView issuer() {
        return new PartyView(
                "Savour et Plus", List.of("2190, rue Gabriel-Sagard", "Drummondville, QC J2B 0P8"),
                "savouretplus@gmail.com", "+1 438 969 1433");
    }

    private PartyView customer(Quotation quotation) {
        return new PartyView(
                quotation.customerName(),
                quotation.customerAddress() == null ? List.of() : quotation.customerAddress().displayLines(),
                quotation.customerEmail(), QuotationContactNormalizer.documentPhone(
                        quotation.customerPhone()));
    }

    private ItemView item(QuotationItem item) {
        List<String> details = new ArrayList<>();
        if (item.purchaseModeLabel() != null && !item.purchaseModeLabel().isBlank()) {
            details.add("Format : " + item.purchaseModeLabel());
        }
        item.choices().forEach(value -> details.add(value.groupLabel() + " : " + value.name()));
        if (!item.allocations().isEmpty()) {
            details.add("Répartition : " + item.allocations().stream()
                    .map(value -> value.name() + " x " + value.quantity())
                    .reduce((left, right) -> left + ", " + right).orElse(""));
        }
        if (!item.ingredients().isEmpty()) {
            details.add("Ingrédients : " + item.ingredients().stream()
                    .map(value -> value.name() + " x " + value.quantity())
                    .reduce((left, right) -> left + ", " + right).orElse(""));
        }
        return new ItemView(
                item.productName(), details, item.quantity(), money(item.unitPriceCents()), money(item.lineTotalCents()));
    }

    private String logoDataUri() {
        try {
            byte[] logo = new ClassPathResource(LOGO_PATH).getContentAsByteArray();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(logo);
        } catch (IOException exception) {
            throw new IllegalStateException("Impossible de charger le logo des documents", exception);
        }
    }

    private String money(int cents) {
        DecimalFormat format = new DecimalFormat("#,##0.00", DecimalFormatSymbols.getInstance(LOCALE));
        format.setRoundingMode(RoundingMode.HALF_UP);
        return format.format(BigDecimal.valueOf(cents, 2)) + " CAD";
    }

    /** Contains template-ready party contact information. */
    public record PartyView(String name, List<String> addressLines, String email, String phone) {
    }

    /** Contains one template-ready product snapshot. */
    public record ItemView(String description, List<String> details, int quantity, String unitPrice, String lineTotal) {
    }
}
