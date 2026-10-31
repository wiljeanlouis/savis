package com.savouretplus.savis.supply.domain;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.savouretplus.savis.common.Money;

class OfferTest {

    @Test
    void acceptsPricesExactlyRepresentableToTheCent() {
        assertDoesNotThrow(() -> offer(new BigDecimal("12.990")));
    }

    @Test
    void rejectsFractionalCentsAndNegativePrices() {
        assertThrows(IllegalArgumentException.class, () -> offer(new BigDecimal("12.995")));
        assertThrows(IllegalArgumentException.class, () -> offer(new BigDecimal("-0.01")));
    }

    private Offer offer(BigDecimal amount) {
        return new Offer(
                UUID.randomUUID(), "external", "https://example.test/offer", "Farine",
                "Marque", "Farine", null, new Money(amount, "CAD"), null,
                new Provider("Fournisseur", "provider", "https://example.test", "Montréal"),
                LocalDateTime.parse("2026-10-13T12:00:00"), OfferStatus.AVAILABLE);
    }
}
