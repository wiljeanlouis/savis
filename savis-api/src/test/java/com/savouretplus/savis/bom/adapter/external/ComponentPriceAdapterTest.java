package com.savouretplus.savis.bom.adapter.external;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.bom.port.ComponentPriceRequest;
import com.savouretplus.savis.supply.api.OfferPricing;
import com.savouretplus.savis.supply.api.SupplyApi;
import com.savouretplus.savis.supply.domain.Offer;

class ComponentPriceAdapterTest {

    @Test
    void getPrice_ShouldCalculateRequestedQuantityPriceFromSelectedOfferPackageSize() {
        UUID offerId = UUID.randomUUID();
        ComponentPriceAdapter adapter = new ComponentPriceAdapter(new StubSupplyApi(
                new OfferPricing(offerId, "", "", Money.of(4), new Quantity(1, Unit.LITER))));

        Money price = adapter.getPrice(new ComponentPriceRequest("milk", new Quantity(10, Unit.MILLILITER), offerId)).amount();

        Assertions.assertEquals(0, price.amount().compareTo(new BigDecimal("0.04")));
        Assertions.assertEquals("CAD", price.currency());
    }

    @Test
    void getPrice_ShouldCalculateRequestedQuantityPriceAcrossGramAndKilogram() {
        UUID offerId = UUID.randomUUID();
        ComponentPriceAdapter adapter = new ComponentPriceAdapter(new StubSupplyApi(
                new OfferPricing(offerId, "", "", Money.of(6), new Quantity(2, Unit.KILOGRAM))));

        Money price = adapter.getPrice(new ComponentPriceRequest("flour", new Quantity(500, Unit.GRAM), offerId)).amount();

        Assertions.assertEquals(0, price.amount().compareTo(new BigDecimal("1.50")));
    }

    @Test
    void getPrices_ShouldReuseSelectedOfferPricingForMultipleRequests() {
        UUID offerId = UUID.randomUUID();
        StubSupplyApi supplyApi = new StubSupplyApi(
                new OfferPricing(offerId, "", "", Money.of(6), new Quantity(2, Unit.KILOGRAM)));
        ComponentPriceAdapter adapter = new ComponentPriceAdapter(supplyApi);

        var prices = adapter.getPrices(List.of(
                new ComponentPriceRequest("flour", new Quantity(500, Unit.GRAM), offerId),
                new ComponentPriceRequest("flour", new Quantity(250, Unit.GRAM), offerId)));

        Assertions.assertEquals(2, prices.size());
        Assertions.assertEquals(0, prices.get(new ComponentPriceRequest("flour", new Quantity(500, Unit.GRAM), offerId))
                .amount().amount().compareTo(new BigDecimal("1.50")));
        Assertions.assertEquals(0, prices.get(new ComponentPriceRequest("flour", new Quantity(250, Unit.GRAM), offerId))
                .amount().amount().compareTo(new BigDecimal("0.75")));
        Assertions.assertEquals(1, supplyApi.getOfferPricingCallCount());
    }

    @Test
    void reportsMissingOfferWithoutManufacturingAZero() {
        SupplyApi supply = mock(SupplyApi.class);
        var request = new ComponentPriceRequest("farine", new Quantity(100, Unit.GRAM), null);
        when(supply.getCheapestOfferPricing("farine", request.quantity())).thenReturn(Optional.empty());
        var price = new ComponentPriceAdapter(supply).getPrice(request);
        assertNull(price.amount());
        assertEquals("OFFER_NOT_FOUND", price.diagnostics().getFirst().code());
    }

    @Test
    void preservesUnavailableSelectedOfferWithWarningAndSource() {
        SupplyApi supply = mock(SupplyApi.class);
        UUID id = UUID.randomUUID();
        var observed = java.time.LocalDateTime.of(2026, 10, 1, 12, 0);
        when(supply.getOfferPricing(id)).thenReturn(Optional.of(new OfferPricing(id, "", "",
                Money.of(6), new Quantity(2, Unit.KILOGRAM), "farine", null, "Maxi", observed, "UNAVAILABLE")));
        var request = new ComponentPriceRequest("farine", new Quantity(500, Unit.GRAM), id);
        var price = new ComponentPriceAdapter(supply).getPrice(request);
        assertEquals(0, price.amount().amount().compareTo(new BigDecimal("1.5")));
        assertEquals("SELECTED_OFFER_UNAVAILABLE", price.diagnostics().getFirst().code());
        assertFalse(price.diagnostics().getFirst().blocking());
        assertEquals(id, price.source().usedOfferId());
        assertEquals(observed, price.source().observedAt());
        verify(supply).getOfferPricing(id);
        verifyNoMoreInteractions(supply);
    }

    @Test
    void reportsInvalidSelectedOfferWithoutChangingFallbackPolicy() {
        SupplyApi supply = mock(SupplyApi.class);
        UUID id = UUID.randomUUID();
        var request = new ComponentPriceRequest("farine", new Quantity(100, Unit.GRAM), id);
        List<OfferPricing> invalid = List.of(
                new OfferPricing(id, "", "", null, new Quantity(1, Unit.KILOGRAM)),
                new OfferPricing(id, "", "", Money.of(3), null),
                new OfferPricing(id, "", "", Money.of(3), new Quantity(0, Unit.GRAM)),
                new OfferPricing(id, "", "", Money.of(3), new Quantity(1, Unit.LITER)));
        List<String> codes = List.of("OFFER_PRICE_MISSING", "INVALID_PACKAGE", "INVALID_PACKAGE", "INCOMPATIBLE_UNITS");
        for (int i = 0; i < invalid.size(); i++) {
            when(supply.getOfferPricing(id)).thenReturn(Optional.of(invalid.get(i)));
            var price = new ComponentPriceAdapter(supply).getPrice(request);
            assertNull(price.amount());
            assertEquals(codes.get(i), price.diagnostics().getFirst().code());
        }
        verify(supply, never()).getCheapestOfferPricing(anyString(), any());
    }

    @Test
    void fallsBackOnlyForMissingSelectedOfferAndCachesCompatibleSearches() {
        SupplyApi supply = mock(SupplyApi.class);
        UUID selected = UUID.randomUUID();
        UUID fallback = UUID.randomUUID();
        when(supply.getOfferPricing(selected)).thenReturn(Optional.empty());
        when(supply.getCheapestOfferPricing(eq("farine"), any())).thenReturn(Optional.of(
                new OfferPricing(fallback, "", "", Money.of(4), new Quantity(1, Unit.KILOGRAM))));
        var first = new ComponentPriceRequest("farine", new Quantity(100, Unit.GRAM), selected);
        var second = new ComponentPriceRequest("farine", new Quantity(200, Unit.GRAM), selected);
        var result = new ComponentPriceAdapter(supply).getPrices(List.of(first, second, first));
        assertEquals(2, result.size());
        assertEquals(fallback, result.get(first).source().usedOfferId());
        assertEquals(selected, result.get(first).source().selectedOfferId());
        assertEquals("SELECTED_OFFER_NOT_FOUND", result.get(first).diagnostics().getFirst().code());
        verify(supply).getOfferPricing(selected);
        verify(supply).getCheapestOfferPricing("farine", first.quantity());
        verifyNoMoreInteractions(supply);
    }

    @Test
    void propagatesUnexpectedTechnicalFailure() {
        SupplyApi supply = mock(SupplyApi.class);
        var failure = new IllegalStateException("database unavailable");
        when(supply.getOfferPricing(any())).thenThrow(failure);
        assertSame(failure, assertThrows(IllegalStateException.class, () -> new ComponentPriceAdapter(supply)
                .getPrice(new ComponentPriceRequest("farine", new Quantity(1, Unit.GRAM), UUID.randomUUID()))));
    }

    private static class StubSupplyApi implements SupplyApi {
        private final OfferPricing offerPricing;
        private final AtomicInteger getOfferPricingCallCount = new AtomicInteger();

        StubSupplyApi(OfferPricing offerPricing) {
            this.offerPricing = offerPricing;
        }

        @Override
        public Optional<OfferPricing> getOfferPricing(UUID offerId) {
            getOfferPricingCallCount.incrementAndGet();
            return Optional.of(offerPricing);
        }

        @Override
        public Optional<OfferPricing> getCheapestOfferPricing(String componentName, Quantity quantity) {
            return Optional.of(offerPricing);
        }

        @Override
        public Optional<Money> getPriceFor(String componentName, UUID offerId) {
            return Optional.of(offerPricing.price());
        }

        @Override
        public Money getCheapestPrice(String componentName) {
            return offerPricing.price();
        }

        @Override
        public List<Offer> searchOffers(String componentName) {
            return List.of();
        }

        int getOfferPricingCallCount() {
            return getOfferPricingCallCount.get();
        }
    }
}
