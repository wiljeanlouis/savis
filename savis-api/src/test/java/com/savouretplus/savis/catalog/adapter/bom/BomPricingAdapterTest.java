package com.savouretplus.savis.catalog.adapter.bom;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import com.savouretplus.savis.bom.api.BomPricingApi;
import com.savouretplus.savis.common.Money;

class BomPricingAdapterTest {
    @Test
    void mapsKnownSubtotalAndDiagnosticsThroughTheConsumerPort() {
        var api = mock(BomPricingApi.class);
        UUID id = UUID.randomUUID();
        when(api.getBomPricing(id)).thenReturn(new BomPricingApi.BomPricing(null, BigDecimal.TEN,
                Money.of(2), Money.of(2), Money.ZERO, false, List.of(), List.of(),
                List.of(new BomPricingApi.Diagnostic("ACTIVITY_RATE_MISSING", "COOK", "Taux absent", true))));
        var result = new BomPricingAdapter(api).getPricing(id);
        assertFalse(result.complete());
        assertNull(result.totalCost());
        assertEquals(Money.of(2), result.knownSubtotal());
        assertEquals(BigDecimal.TEN, result.yieldQuantity());
        assertEquals(id, result.diagnostics().getFirst().bomId());
        assertEquals("ACTIVITY_RATE_MISSING", result.diagnostics().getFirst().code());
    }
}
