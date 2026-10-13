package com.savouretplus.savis.order.adapter.pdf;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.Instant;
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
import com.savouretplus.savis.order.domain.CustomerContactNormalizer;
import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderItem;
import com.savouretplus.savis.order.port.OrderDocumentRenderer;
import com.savouretplus.savis.order.usecase.OrderDocumentType;

import lombok.AllArgsConstructor;

/**
 * Renders order documents from a shared HTML template using PDFBox.
 */
@Component
@AllArgsConstructor
public class OpenHtmlToPdfOrderDocumentRenderer implements OrderDocumentRenderer {
    private static final Locale LOCALE = Locale.CANADA_FRENCH;
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Toronto");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy", LOCALE);
    private static final int QUOTE_VALIDITY_DAYS = 30;
    private static final String LOGO_PATH = "templates/brand/savour_et_plus_logo.png";

    private final SpringTemplateEngine templates;

    /**
     * Produces a letter-sized invoice or quote using captured order prices.
     */
    @Override
    public byte[] render(Order order, OrderDocumentType type, Instant generatedAt) {
        Context context = new Context(LOCALE);
        var documentDate = generatedAt.atZone(BUSINESS_ZONE).toLocalDate();
        context.setVariable("quote", type == OrderDocumentType.QUOTE);
        context.setVariable("title", type == OrderDocumentType.QUOTE ? "SOUMISSION" : "FACTURE");
        context.setVariable("documentDate", DATE_FORMAT.format(documentDate));
        context.setVariable("validUntil", DATE_FORMAT.format(documentDate.plusDays(QUOTE_VALIDITY_DAYS)));
        context.setVariable("referenceLabel", "COMMANDE");
        context.setVariable("referenceNumber", order.orderNumber());
        context.setVariable("hasSourceReference", false);
        context.setVariable("cancelled", false);
        context.setVariable("logoDataUri", logoDataUri());
        context.setVariable("issuer", issuer());
        context.setVariable("customer", customer(order));
        context.setVariable("items", order.items().stream().map(this::item).toList());
        context.setVariable("subtotal", money(order.subtotalCents()));
        context.setVariable("discount", money(order.discountCents()));
        context.setVariable("hasDiscount", order.discountCents() > 0);
        context.setVariable("deliveryFee", money(order.deliveryFeeCents()));
        context.setVariable("hasDeliveryFee", order.deliveryFeeCents() > 0);
        context.setVariable("hasGst", false);
        context.setVariable("hasQst", false);
        context.setVariable("total", money(order.totalCents()));
        context.setVariable("paymentTerms", "Paiement par virement Interac.");
        context.setVariable("quoteValidityDays", QUOTE_VALIDITY_DAYS);
        context.setVariable("hasNote", false);

        String html = templates.process("order/order-document", context);
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = CommercialPdfFonts.registerOn(new PdfRendererBuilder());
            builder
                    .useFastMode()
                    .withHtmlContent(html, null)
                    .toStream(output)
                    .run();
            return output.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Impossible de générer le document PDF", exception);
        }
    }

    private PartyView issuer() {
        return new PartyView(
                "Savour et Plus",
                List.of("2190, rue Gabriel-Sagard", "Drummondville, QC J2B 0P8"),
                "savouretplus@gmail.com",
                "+1 438 969 1433");
    }

    private String logoDataUri() {
        try {
            byte[] logo = new ClassPathResource(LOGO_PATH).getContentAsByteArray();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(logo);
        } catch (IOException exception) {
            throw new IllegalStateException("Impossible de charger le logo des documents", exception);
        }
    }

    private PartyView customer(Order order) {
        List<String> address = order.customerAddress() == null
                ? List.of()
                : order.customerAddress().displayLines();
        return new PartyView(
                order.customerName(), address, order.customerEmail(),
                CustomerContactNormalizer.formatPhoneForDocument(order.customerPhone()));
    }

    private ItemView item(OrderItem item) {
        List<String> details = new ArrayList<>();
        if (item.purchaseModeLabel() != null && !item.purchaseModeLabel().isBlank()) {
            details.add("Format : " + item.purchaseModeLabel());
        }
        item.choiceSelections().forEach(value -> details.add(value.groupLabel() + " : " + value.choiceName()));
        if (!item.choiceAllocations().isEmpty()) {
            String allocations = item.choiceAllocations().stream()
                    .map(value -> value.choiceName() + " x " + value.quantity())
                    .reduce((left, right) -> left + ", " + right)
                    .orElse("");
            details.add("Répartition : " + allocations);
        }
        if (!item.ingredientSelections().isEmpty()) {
            String ingredients = item.ingredientSelections().stream()
                    .map(value -> value.ingredientName() + " x " + value.quantity())
                    .reduce((left, right) -> left + ", " + right)
                    .orElse("");
            details.add("Ingrédients : " + ingredients);
        }
        return new ItemView(
                item.productNameSnapshot(), details, item.quantity(), money(item.unitPriceCents()),
                money(item.lineTotalCents()));
    }

    private String money(int cents) {
        DecimalFormat format = new DecimalFormat("#,##0.00", DecimalFormatSymbols.getInstance(LOCALE));
        format.setRoundingMode(RoundingMode.HALF_UP);
        return format.format(BigDecimal.valueOf(cents, 2)) + " CAD";
    }

    /**
     * Provides template-ready contact information for either document party.
     */
    public record PartyView(String name, List<String> addressLines, String email, String phone) {
    }

    /**
     * Provides one template-ready item row and its configuration details.
     */
    public record ItemView(
            String description,
            List<String> details,
            int quantity,
            String unitPrice,
            String lineTotal) {
    }
}
