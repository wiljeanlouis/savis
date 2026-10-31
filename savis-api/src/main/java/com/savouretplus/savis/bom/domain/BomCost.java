package com.savouretplus.savis.bom.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Stream;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;

/** Immutable valuation of the existing BOM scope: components and activities only. */
public record BomCost(List<Line> components, List<Line> activities,
        BigDecimal yieldQuantity, List<Diagnostic> issues) {
    public BomCost {
        components = List.copyOf(components);
        activities = List.copyOf(activities);
        Objects.requireNonNull(yieldQuantity, "Rendement requis");
        issues = List.copyOf(issues);
    }

    public enum Status { KNOWN, MISSING, NOT_APPLICABLE }

    public record Diagnostic(String code, String source, String message, boolean blocking) {
        public Diagnostic {
            Objects.requireNonNull(code);
            Objects.requireNonNull(source);
            Objects.requireNonNull(message);
        }
    }

    /** Supplier values actually used; consumption cost is not a whole-package purchase budget. */
    public record Source(UUID selectedOfferId, UUID usedOfferId, LocalDateTime observedAt,
            Money packagePrice, Quantity packageSize) {}

    public record Line(String label, Status status, Money amount, BigDecimal quantity,
            String unit, Money hourlyRate, Source source, List<Diagnostic> diagnostics) {
        public Line {
            Objects.requireNonNull(label);
            Objects.requireNonNull(status);
            Objects.requireNonNull(quantity);
            Objects.requireNonNull(unit);
            diagnostics = List.copyOf(diagnostics);
            if ((status == Status.KNOWN) != (amount != null)) {
                throw new IllegalArgumentException("Un montant est requis uniquement pour un coût connu");
            }
            if (amount != null && amount.amount().signum() < 0) {
                throw new IllegalArgumentException("Un coût ne peut pas être négatif");
            }
            if (status == Status.MISSING && diagnostics.stream().noneMatch(Diagnostic::blocking)) {
                throw new IllegalArgumentException("Un coût manquant doit être expliqué");
            }
            if (status == Status.NOT_APPLICABLE && diagnostics.isEmpty()) {
                throw new IllegalArgumentException("Un poste sans objet doit être justifié");
            }
        }
    }

    public Money componentSubtotal() { return subtotal(components); }
    public Money activitySubtotal() { return subtotal(activities); }
    public Money knownSubtotal() { return componentSubtotal().add(activitySubtotal()); }

    public boolean complete() {
        return yieldQuantity.signum() > 0
                && Stream.concat(components.stream(), activities.stream())
                        .noneMatch(line -> line.status() == Status.MISSING)
                && diagnostics().stream().noneMatch(Diagnostic::blocking);
    }

    public Money totalCost() { return complete() ? knownSubtotal() : null; }

    public List<Diagnostic> diagnostics() {
        return Stream.concat(issues.stream(), Stream.concat(components.stream(), activities.stream())
                .flatMap(line -> line.diagnostics().stream())).distinct().toList();
    }

    private Money subtotal(List<Line> lines) {
        return lines.stream().filter(line -> line.status() == Status.KNOWN)
                .map(Line::amount).reduce(Money.ZERO, Money::add);
    }
}
