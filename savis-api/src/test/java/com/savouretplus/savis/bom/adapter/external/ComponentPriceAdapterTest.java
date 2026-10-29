package com.savouretplus.savis.bom.adapter.external;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import com.savouretplus.savis.bom.port.ComponentPriceRequest;
import com.savouretplus.savis.common.*;
import com.savouretplus.savis.supply.api.*;

class ComponentPriceAdapterTest {
    private final UUID resource = UUID.randomUUID();
    private final SupplyApi supply = mock(SupplyApi.class);
    private final ComponentPriceAdapter adapter = new ComponentPriceAdapter(supply);

    private OfferPricing offer(UUID id, UUID resourceId, double price, Quantity pack, String status) {
        return new OfferPricing(id, "", "", Money.of(price), pack, "Nom fournisseur différent",
                null, "Fournisseur", LocalDateTime.of(2026, 10, 1, 12, 0), status, resourceId);
    }
    private ComponentPriceRequest request(UUID selected, double quantity, Unit unit) {
        return new ComponentPriceRequest("farine", new Quantity(quantity, unit), selected, resource);
    }

    @Test void batchesResourcesAndSelectionsAndReusesPricesAcrossQuantities() {
        UUID id = UUID.randomUUID();
        when(supply.getPricingCandidates(Set.of(resource), Set.of(id))).thenReturn(List.of(
                offer(id, resource, 6, new Quantity(2, Unit.KILOGRAM), "AVAILABLE")));
        var first = request(id, 500, Unit.GRAM);
        var second = request(id, 250, Unit.GRAM);
        var prices = adapter.getPrices(List.of(first, second, first));
        assertEquals(2, prices.size());
        assertEquals(0, new BigDecimal("1.50").compareTo(prices.get(first).amount().amount()));
        assertEquals(0, new BigDecimal("0.75").compareTo(prices.get(second).amount().amount()));
        verify(supply).getPricingCandidates(Set.of(resource), Set.of(id));
        verifyNoMoreInteractions(supply);
    }

    @Test void searchesByResourceAndCompatibleBaseUnitRatherThanNameOrPackagePrice() {
        UUID cheapest = UUID.randomUUID();
        when(supply.getPricingCandidates(Set.of(resource), Set.of())).thenReturn(List.of(
                offer(UUID.randomUUID(), UUID.randomUUID(), 0.01, new Quantity(1, Unit.KILOGRAM), "AVAILABLE"),
                offer(UUID.randomUUID(), resource, 1, new Quantity(1, Unit.LITER), "AVAILABLE"),
                offer(UUID.randomUUID(), resource, 2, new Quantity(100, Unit.GRAM), "AVAILABLE"),
                offer(cheapest, resource, 4, new Quantity(1, Unit.KILOGRAM), "AVAILABLE")));
        var price = adapter.getPrice(request(null, 500, Unit.GRAM));
        assertEquals(cheapest, price.source().usedOfferId());
        assertEquals(0, new BigDecimal("2").compareTo(price.amount().amount()));
    }

    @Test void selectedUnavailableOfferKeepsLastPriceAndProvenance() {
        UUID id = UUID.randomUUID();
        var offer = offer(id, resource, 4, new Quantity(1, Unit.LITER), "UNAVAILABLE");
        when(supply.getPricingCandidates(Set.of(resource), Set.of(id))).thenReturn(List.of(offer));
        var price = adapter.getPrice(request(id, 10, Unit.MILLILITER));
        assertEquals(0, new BigDecimal("0.04").compareTo(price.amount().amount()));
        assertEquals("SELECTED_OFFER_UNAVAILABLE", price.diagnostics().getFirst().code());
        assertFalse(price.diagnostics().getFirst().blocking());
        assertEquals(offer.observedAt(), price.source().observedAt());
    }

    @Test void refusesForeignOrUnassociatedSelectedOfferWithoutFallback() {
        UUID id = UUID.randomUUID();
        for (UUID other : new UUID[] { UUID.randomUUID(), null }) {
            when(supply.getPricingCandidates(Set.of(resource), Set.of(id))).thenReturn(List.of(
                    offer(id, other, 4, new Quantity(1, Unit.KILOGRAM), "AVAILABLE"),
                    offer(UUID.randomUUID(), resource, 1, new Quantity(1, Unit.KILOGRAM), "AVAILABLE")));
            var price = adapter.getPrice(request(id, 100, Unit.GRAM));
            assertNull(price.amount());
            assertEquals("OFFER_RESOURCE_MISMATCH", price.diagnostics().getFirst().code());
            assertTrue(price.diagnostics().getFirst().blocking());
        }
    }

    @Test void missingSelectionFallsBackToCheapestResourceOffer() {
        UUID id = UUID.randomUUID(), fallback = UUID.randomUUID();
        when(supply.getPricingCandidates(Set.of(resource), Set.of(id))).thenReturn(List.of(
                offer(fallback, resource, 4, new Quantity(1, Unit.KILOGRAM), "AVAILABLE")));
        var price = adapter.getPrice(request(id, 100, Unit.GRAM));
        assertEquals(fallback, price.source().usedOfferId());
        assertEquals(id, price.source().selectedOfferId());
        assertEquals("SELECTED_OFFER_NOT_FOUND", price.diagnostics().getFirst().code());
    }

    @Test void keepsMissingPriceAndInvalidPackageAndUnitDiagnostics() {
        UUID id = UUID.randomUUID();
        var invalid = List.of(
                new OfferPricing(id, "", "", null, new Quantity(1, Unit.KILOGRAM), null, null, null, null, "AVAILABLE", resource),
                offer(id, resource, 3, null, "AVAILABLE"),
                offer(id, resource, 3, new Quantity(0, Unit.GRAM), "AVAILABLE"),
                offer(id, resource, 3, new Quantity(1, Unit.LITER), "AVAILABLE"));
        var codes = List.of("OFFER_PRICE_MISSING", "INVALID_PACKAGE", "INVALID_PACKAGE", "INCOMPATIBLE_UNITS");
        for (int i = 0; i < invalid.size(); i++) {
            when(supply.getPricingCandidates(Set.of(resource), Set.of(id))).thenReturn(List.of(invalid.get(i)));
            var price = adapter.getPrice(request(id, 100, Unit.GRAM));
            assertNull(price.amount());
            assertEquals(codes.get(i), price.diagnostics().getFirst().code());
        }
    }

    @Test void missingOfferNeverBecomesZero() {
        var price = adapter.getPrice(request(null, 100, Unit.GRAM));
        assertNull(price.amount());
        assertEquals("OFFER_NOT_FOUND", price.diagnostics().getFirst().code());
    }

    @Test void propagatesTechnicalFailure() {
        var failure = new IllegalStateException("database unavailable");
        when(supply.getPricingCandidates(anySet(), anySet())).thenThrow(failure);
        assertSame(failure, assertThrows(IllegalStateException.class,
                () -> adapter.getPrice(request(null, 100, Unit.GRAM))));
    }
}
