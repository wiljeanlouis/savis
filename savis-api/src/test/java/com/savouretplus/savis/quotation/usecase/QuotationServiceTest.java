package com.savouretplus.savis.quotation.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.catalog.api.CatalogOrderingApi;
import com.savouretplus.savis.order.api.QuotationOrderApi;
import com.savouretplus.savis.quotation.domain.Quotation;
import com.savouretplus.savis.quotation.domain.QuotationItem;
import com.savouretplus.savis.quotation.domain.QuotationStatus;
import com.savouretplus.savis.quotation.port.QuotationNumberGenerator;
import com.savouretplus.savis.quotation.port.QuotationRepository;

@ExtendWith(MockitoExtension.class)
class QuotationServiceTest {
    private static final Instant NOW = Instant.parse("2026-10-12T15:00:00Z");
    private static final UUID QUOTATION_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID PRODUCT_ID = UUID.fromString("20000000-0000-4000-8000-000000000002");
    private static final UUID ORDER_ID = UUID.fromString("30000000-0000-4000-8000-000000000003");

    @Mock QuotationRepository repository;
    @Mock QuotationNumberGenerator numbers;
    @Mock CatalogOrderingApi catalog;
    @Mock QuotationOrderApi orders;

    @Test
    void capturesProductNatureConfigurationAndCurrentPrice() {
        when(numbers.next()).thenReturn("SOU-00000001");
        when(catalog.snapshot(any())).thenReturn(productSnapshot());
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Quotation created = service().create(command());

        assertEquals(2400, created.subtotalCents());
        assertEquals(2450, created.totalCents());
        assertEquals("SERVICE", created.items().getFirst().commercialType());
        assertEquals("Installation personnalisée", created.items().getFirst().productName());
        assertEquals(1200, created.items().getFirst().unitPriceCents());
        assertEquals("Vanille", created.items().getFirst().choices().getFirst().name());
    }

    @Test
    void onlyDraftQuotationsCanBeEdited() {
        Quotation sent = quotation(QuotationStatus.SENT, null);
        when(repository.findByPublicIdForUpdate(QUOTATION_ID)).thenReturn(Optional.of(sent));

        assertThrows(IllegalStateException.class, () -> service().update(QUOTATION_ID, command()));
        verify(catalog, never()).snapshot(any());
    }

    @Test
    void convertsOnlyOnceAndPassesCapturedPricesWithoutCatalogRecalculation() {
        Quotation accepted = quotation(QuotationStatus.ACCEPTED, null);
        Quotation converted = accepted.convertedTo(ORDER_ID, NOW);
        when(repository.findByPublicIdForUpdate(QUOTATION_ID))
                .thenReturn(Optional.of(accepted))
                .thenReturn(Optional.of(converted));
        when(orders.create(any())).thenReturn(ORDER_ID);
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UUID first = service().convert(QUOTATION_ID);
        UUID second = service().convert(QUOTATION_ID);

        assertEquals(ORDER_ID, first);
        assertEquals(ORDER_ID, second);
        ArgumentCaptor<QuotationOrderApi.QuotationSnapshot> snapshot =
                ArgumentCaptor.forClass(QuotationOrderApi.QuotationSnapshot.class);
        verify(orders).create(snapshot.capture());
        assertEquals(1200, snapshot.getValue().items().getFirst().unitPriceCents());
        assertEquals(2400, snapshot.getValue().items().getFirst().lineTotalCents());
        verify(catalog, never()).snapshot(any());
    }

    private QuotationService service() {
        return new QuotationService(
                repository, numbers, catalog, orders, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private SaveQuotationCommand command() {
        return new SaveQuotationCommand(
                "Ada", "514 555-0100", "ada@example.com", null,
                LocalDate.of(2026, 11, 12), "Offre complète", 100, 150,
                List.of(new SaveQuotationCommand.Item(
                        PRODUCT_ID, 2, "service", "vanilla", List.of(), List.of())));
    }

    private CatalogOrderingApi.ProductSnapshot productSnapshot() {
        return new CatalogOrderingApi.ProductSnapshot(
                PRODUCT_ID, "Installation personnalisée", "SERVICE", "SINGLE_CHOICE", null,
                1200, 1200,
                new CatalogOrderingApi.PurchaseModeSnapshot("service", "Service", 1, "SINGLE_CHOICE"),
                new CatalogOrderingApi.ChoiceSelectionSnapshot("vanilla", "Vanille", "Style"),
                List.of(), List.of());
    }

    private Quotation quotation(QuotationStatus status, UUID orderId) {
        QuotationItem item = new QuotationItem(
                null, PRODUCT_ID, "Installation personnalisée", "SERVICE", "SINGLE_CHOICE", null,
                2, 1200, 1200, 2400, "service", "Service", 1, "SINGLE_CHOICE",
                List.of(new QuotationItem.Choice("vanilla", "Vanille", "Style")),
                List.of(), List.of());
        return new Quotation(
                1L, QUOTATION_ID, "SOU-00000001", status,
                "Ada", "+15145550100", "ada@example.com", null,
                LocalDate.of(2026, 11, 12), "Offre complète", 100, 150, 2450,
                NOW, NOW, status != QuotationStatus.DRAFT ? NOW : null,
                status == QuotationStatus.ACCEPTED ? NOW : null,
                status == QuotationStatus.REJECTED ? NOW : null,
                orderId, List.of(item));
    }
}
