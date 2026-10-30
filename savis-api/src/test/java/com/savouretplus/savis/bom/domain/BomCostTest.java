package com.savouretplus.savis.bom.domain;

import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import com.savouretplus.savis.bom.port.ComponentPrice;
import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;

class BomCostTest {
    private Bom bom(double yield) {
        return new Bom(null, "Gâteau", "", "", "", BomType.FOOD,
                List.of(), List.of(new Activity(null, ActivityType.COOK, Minute.of(40), 1)),
                new Yield(new Quantity(yield, Unit.PIECE), Unit.PIECE));
    }

    @Test
    void keepsKnownSubtotalAndExplainsMissingComponentAndRate() {
        Bom bom = bom(12);
        bom.addComponent("Farine", 100, Unit.GRAM, null);
        bom.addComponent("Sucre", 100, Unit.GRAM, null);
        var prices = Map.of(bom.componentPriceRequests().getFirst(), new ComponentPrice(Money.of(2), null, List.of()));
        var result = bom.calculateCost(prices, Map.of());
        assertEquals(Money.of(2), result.knownSubtotal());
        assertFalse(result.complete());
        assertNull(result.totalCost());
        assertEquals(BomCost.Status.KNOWN, result.components().getFirst().status());
        assertEquals(BomCost.Status.MISSING, result.components().get(1).status());
        assertEquals(BomCost.Status.MISSING, result.activities().getFirst().status());
        assertTrue(result.diagnostics().stream().anyMatch(d -> d.code().equals("ACTIVITY_RATE_MISSING")));
    }

    @Test
    void explicitZeroHourlyRateIsKnownAndCookFormulaIsUnchanged() {
        var zero = bom(12).calculateCost(Map.of(), Map.of(ActivityType.COOK, Money.ZERO));
        assertTrue(zero.complete());
        assertEquals(0, zero.totalCost().amount().signum());
        var priced = bom(12).calculateCost(Map.of(), Map.of(ActivityType.COOK, Money.of(60)));
        assertEquals(0, priced.totalCost().amount().compareTo(new BigDecimal("40.0000000020")));
        assertEquals(Money.of(60), priced.activities().getFirst().hourlyRate());
        assertEquals(new BigDecimal("40"), priced.activities().getFirst().quantity());
    }

    @Test
    void zeroYieldKeepsKnownBatchCostsButPreventsCompleteUnitValuation() {
        var result = bom(0).calculateCost(Map.of(), Map.of(ActivityType.COOK, Money.of(60)));
        assertFalse(result.complete());
        assertNull(result.totalCost());
        assertEquals(0, result.knownSubtotal().amount().compareTo(new BigDecimal("40.0000000020")));
        assertEquals("INVALID_YIELD", result.diagnostics().getFirst().code());
    }

    @Test
    void knownZeroComponentIsComplete() {
        var bom = new Bom(null, "Eau", "", "", "", BomType.FOOD, List.of(), List.of(), null);
        bom.addComponent("Eau", 100, Unit.MILLILITER, null);
        var result = bom.calculateCost(Map.of(bom.componentPriceRequests().getFirst(),
                new ComponentPrice(Money.ZERO, null, List.of())), Map.of());
        assertTrue(result.complete());
        assertEquals(BomCost.Status.KNOWN, result.components().getFirst().status());
        assertEquals(Money.ZERO, result.totalCost());
    }

    @Test
    void validatesLineInvariantsAndDoesNotInferNotApplicable() {
        assertThrows(IllegalArgumentException.class, () -> new BomCost.Line("Farine", BomCost.Status.KNOWN,
                null, BigDecimal.ONE, "g", null, null, List.of()));
        assertThrows(IllegalArgumentException.class, () -> new BomCost.Line("Farine", BomCost.Status.MISSING,
                Money.ZERO, BigDecimal.ONE, "g", null, null, List.of()));
        assertThrows(IllegalArgumentException.class, () -> new BomCost.Line("Farine", BomCost.Status.NOT_APPLICABLE,
                null, BigDecimal.ONE, "g", null, null, List.of()));
        var result = bom(1).calculateCost(Map.of(), Map.of());
        assertThrows(UnsupportedOperationException.class, () -> result.activities().clear());
        assertEquals(BomCost.Status.MISSING, result.activities().getFirst().status());
    }
}
