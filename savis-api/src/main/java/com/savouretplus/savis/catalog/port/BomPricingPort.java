package com.savouretplus.savis.catalog.port;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import com.savouretplus.savis.catalog.domain.CostDiagnostic;
import com.savouretplus.savis.common.Money;

/** Consumer-owned BOM valuation contract. Unexpected technical failures propagate. */
public interface BomPricingPort {
    boolean exists(UUID bomId);
    BomPricing getPricing(UUID bomId);

    record BomPricing(Money totalCost, BigDecimal yieldQuantity, Money knownSubtotal,
            boolean complete, List<CostDiagnostic> diagnostics) {
        public BomPricing {
            Objects.requireNonNull(knownSubtotal);
            diagnostics = List.copyOf(diagnostics);
            if (complete != (totalCost != null)
                    || (complete && (yieldQuantity == null || yieldQuantity.signum() <= 0
                    || diagnostics.stream().anyMatch(CostDiagnostic::blocking)))) {
                throw new IllegalArgumentException("Valorisation BOM incohérente");
            }
        }
        /** Convenience constructor for a fully resolved valuation. */
        public BomPricing(Money totalCost, BigDecimal yieldQuantity) {
            this(totalCost, yieldQuantity, totalCost, true, List.of());
        }
    }
}
