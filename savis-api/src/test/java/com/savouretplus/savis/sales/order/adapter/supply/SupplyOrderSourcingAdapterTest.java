package com.savouretplus.savis.sales.order.adapter.supply;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.supply.api.OfferPricing;
import com.savouretplus.savis.supply.api.SupplyApi;

@ExtendWith(MockitoExtension.class)
class SupplyOrderSourcingAdapterTest {

    @Mock SupplyApi supply;

    @Test
    void usesTheSelectedCompatibleOfferAndMapsItsSupplierMetadata() {
        UUID offerId = UUID.randomUUID();
        LocalDateTime observedAt = LocalDateTime.parse("2026-08-08T12:00:00");
        when(supply.getOfferPricing(offerId)).thenReturn(Optional.of(new OfferPricing(
                offerId,
                "Sans Nom",
                "Sac de farine",
                Money.of(6),
                new Quantity(5, Unit.KILOGRAM),
                "Farine",
                "https://example.com/flour.jpg",
                "Maxi",
                observedAt)));
        SupplyOrderSourcingAdapter adapter = new SupplyOrderSourcingAdapter(supply);

        var result = adapter.findCurrent("farine", new BigDecimal("2"), Unit.KILOGRAM, offerId);

        assertEquals(true, result.isPresent());
        assertEquals("Sac de farine", result.orElseThrow().productName());
        assertEquals("https://example.com/flour.jpg", result.orElseThrow().imageUrl());
        assertEquals("Sans Nom", result.orElseThrow().brandOrLabel());
        assertEquals("Maxi", result.orElseThrow().supplierName());
        assertEquals(observedAt, result.orElseThrow().observedAt());
        verify(supply).getOfferPricing(offerId);
    }

    @Test
    void fallsBackToTheCheapestCompatibleOfferWhenTheSelectedOfferIsMissing() {
        UUID selectedOfferId = UUID.randomUUID();
        UUID cheapestOfferId = UUID.randomUUID();
        Quantity requested = new Quantity(500, Unit.GRAM);
        when(supply.getOfferPricing(selectedOfferId)).thenReturn(Optional.empty());
        when(supply.getCheapestOfferPricing("farine", requested)).thenReturn(Optional.of(new OfferPricing(
                cheapestOfferId,
                "Sans Nom",
                "Sac de farine",
                Money.of(6),
                new Quantity(2, Unit.KILOGRAM))));
        SupplyOrderSourcingAdapter adapter = new SupplyOrderSourcingAdapter(supply);

        var result = adapter.findCurrent("farine", new BigDecimal("500"), Unit.GRAM, selectedOfferId);

        assertEquals(cheapestOfferId, result.orElseThrow().supplierProductId());
        verify(supply).getOfferPricing(selectedOfferId);
        verify(supply).getCheapestOfferPricing("farine", requested);
    }
}
