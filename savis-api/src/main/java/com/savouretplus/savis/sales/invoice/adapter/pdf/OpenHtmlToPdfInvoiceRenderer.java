package com.savouretplus.savis.sales.invoice.adapter.pdf;

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

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.savouretplus.savis.common.pdf.CommercialPdfFonts;
import com.savouretplus.savis.sales.invoice.domain.Invoice;
import com.savouretplus.savis.sales.invoice.domain.InvoiceItem;
import com.savouretplus.savis.sales.invoice.domain.InvoiceStatus;
import com.savouretplus.savis.sales.invoice.port.InvoiceDocumentRenderer;

import lombok.AllArgsConstructor;

/** Renders final invoice documents exclusively from persisted invoice snapshots. */
@Component
@AllArgsConstructor
public class OpenHtmlToPdfInvoiceRenderer implements InvoiceDocumentRenderer {
    private static final Locale LOCALE = Locale.CANADA_FRENCH;
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Toronto");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy", LOCALE);
    private static final String LOGO_PATH = "templates/brand/savour_et_plus_logo.png";
    private static final PhoneNumberUtil PHONES = PhoneNumberUtil.getInstance();

    private final SpringTemplateEngine templates;

    /** Produces a letter-sized invoice using only immutable invoice values. */
    @Override
    public byte[] render(Invoice invoice) {
        Context context = new Context(LOCALE);
        context.setVariable("quote", false);
        context.setVariable("title", "FACTURE");
        context.setVariable("documentDate", DATE_FORMAT.format(
                invoice.issuedAt().atZone(BUSINESS_ZONE).toLocalDate()));
        context.setVariable("referenceLabel", "FACTURE");
        context.setVariable("referenceNumber", invoice.invoiceNumber());
        context.setVariable("hasSourceReference", true);
        context.setVariable("sourceReferenceLabel", "COMMANDE");
        context.setVariable("sourceReferenceNumber", invoice.sourceOrderNumber());
        context.setVariable("cancelled", invoice.status() == InvoiceStatus.CANCELLED);
        context.setVariable("logoDataUri", logoDataUri());
        context.setVariable("issuer", issuer());
        context.setVariable("customer", customer(invoice));
        context.setVariable("items", invoice.items().stream().map(this::item).toList());
        context.setVariable("subtotal", money(invoice.subtotalCents()));
        context.setVariable("discount", money(invoice.discountCents()));
        context.setVariable("hasDiscount", invoice.discountCents() > 0);
        context.setVariable("deliveryFee", money(invoice.deliveryFeeCents()));
        context.setVariable("hasDeliveryFee", invoice.deliveryFeeCents() > 0);
        context.setVariable("gst", money(invoice.gstCents()));
        context.setVariable("hasGst", invoice.gstCents() > 0);
        context.setVariable("qst", money(invoice.qstCents()));
        context.setVariable("hasQst", invoice.qstCents() > 0);
        context.setVariable("total", money(invoice.totalCents()));
        context.setVariable("note", invoice.note());
        context.setVariable("hasNote", invoice.note() != null && !invoice.note().isBlank());
        context.setVariable("paymentTerms", "Paiement par virement Interac.");

        String html = templates.process("order/order-document", context);
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = CommercialPdfFonts.registerOn(new PdfRendererBuilder());
            builder.useFastMode().withHtmlContent(html, null).toStream(output).run();
            return output.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Impossible de générer la facture PDF", exception);
        }
    }

    private PartyView issuer() {
        return new PartyView(
                "Savour et Plus", List.of("2190, rue Gabriel-Sagard", "Drummondville, QC J2B 0P8"),
                "savouretplus@gmail.com", "+1 438 969 1433");
    }

    private PartyView customer(Invoice invoice) {
        return new PartyView(
                invoice.customerName(),
                invoice.customerAddress() == null ? List.of() : invoice.customerAddress().displayLines(),
                invoice.customerEmail(), documentPhone(invoice.customerPhone()));
    }

    private ItemView item(InvoiceItem item) {
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

    private String documentPhone(String value) {
        try {
            var phone = PHONES.parse(value, "CA");
            return PHONES.isValidNumber(phone)
                    ? PHONES.format(phone, PhoneNumberUtil.PhoneNumberFormat.INTERNATIONAL).replace('-', ' ')
                    : value;
        } catch (NumberParseException exception) {
            return value;
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

    /** Contains one template-ready invoiced item. */
    public record ItemView(String description, List<String> details, int quantity, String unitPrice, String lineTotal) {
    }
}
