package com.savouretplus.savis.bom.adapter.external;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

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

        Money price = adapter.getPrice(new ComponentPriceRequest("milk", new Quantity(10, Unit.MILLILITER), offerId));

        Assertions.assertEquals(0, price.amount().compareTo(new BigDecimal("0.04")));
        Assertions.assertEquals("CAD", price.currency());
    }

    @Test
    void getPrice_ShouldCalculateRequestedQuantityPriceAcrossGramAndKilogram() {
        UUID offerId = UUID.randomUUID();
        ComponentPriceAdapter adapter = new ComponentPriceAdapter(new StubSupplyApi(
                new OfferPricing(offerId, "", "", Money.of(6), new Quantity(2, Unit.KILOGRAM))));

        Money price = adapter.getPrice(new ComponentPriceRequest("flour", new Quantity(500, Unit.GRAM), offerId));

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
                .amount().compareTo(new BigDecimal("1.50")));
        Assertions.assertEquals(0, prices.get(new ComponentPriceRequest("flour", new Quantity(250, Unit.GRAM), offerId))
                .amount().compareTo(new BigDecimal("0.75")));
        Assertions.assertEquals(1, supplyApi.getOfferPricingCallCount());
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
