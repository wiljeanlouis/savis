package com.savouretplus.savis.bom.api;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.savouretplus.savis.common.Money;

/** Public, immutable valuation snapshot for consumers; no persistence or internal domain types. */
public interface BomPricingApi {
    boolean existsBom(UUID bomId);
    BomPricing getBomPricing(UUID bomId);

    record Diagnostic(String code, String source, String message, boolean blocking) {}
    record PriceSource(UUID selectedOfferId, UUID usedOfferId, LocalDateTime observedAt,
            Money packagePrice, BigDecimal packageQuantity, String packageUnit) {}
    record CostLine(String label, String status, Money amount, BigDecimal quantity, String unit,
            Money hourlyRate, PriceSource source, List<Diagnostic> diagnostics) {
        public CostLine { diagnostics = List.copyOf(diagnostics); }
    }
    record BomPricing(Money totalCost, BigDecimal yieldQuantity,
            Money knownSubtotal, Money componentSubtotal, Money activitySubtotal,
            boolean complete, List<CostLine> components, List<CostLine> activities,
            List<Diagnostic> diagnostics) {
        public BomPricing {
            components = List.copyOf(components);
            activities = List.copyOf(activities);
            diagnostics = List.copyOf(diagnostics);
            java.util.Objects.requireNonNull(knownSubtotal);
            java.util.Objects.requireNonNull(componentSubtotal);
            java.util.Objects.requireNonNull(activitySubtotal);
            if (complete != (totalCost != null)
                    || (complete && (yieldQuantity == null || yieldQuantity.signum() <= 0
                    || diagnostics.stream().anyMatch(Diagnostic::blocking)
                    || java.util.stream.Stream.concat(components.stream(), activities.stream())
                            .anyMatch(line -> "MISSING".equals(line.status()))))) {
                throw new IllegalArgumentException("Le total est réservé aux coûts complets");
            }
        }
    }
}
