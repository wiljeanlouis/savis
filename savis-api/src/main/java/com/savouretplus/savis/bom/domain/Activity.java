package com.savouretplus.savis.bom.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import com.savouretplus.savis.common.Money;

/**
 * Represents a timed production activity. COOK may currently describe elapsed oven time.
 */
public record Activity(
        Long id,
        ActivityType type,
        Minute minutes,
        Integer sequence) {

    /**
     * Validates a production activity and its ordering metadata.
     */
    public Activity {
        type = type != null ? type : ActivityType.CUSTOM;
        minutes = minutes != null ? minutes : Minute.of(0);
        sequence = sequence != null ? sequence : 0;
    }

    /**
     * Calculates the activity cost using the existing duration and hourly-rate formula.
     */
    public Money calculateCost(Money hourlyRate) {
        if (hourlyRate == null) {
            throw new IllegalArgumentException("Le taux horaire est requis");
        }

        BigDecimal hours = BigDecimal.valueOf(minutes.value())
                .divide(BigDecimal.valueOf(60), 10, RoundingMode.HALF_UP);

        return hourlyRate.multiply(hours);
    }
    /** Keeps the existing minutes / 60 formula, including the current COOK semantics. */
    public BomCost.Line costLine(Money hourlyRate) {
        return new BomCost.Line(type.name(),
                hourlyRate == null ? BomCost.Status.MISSING : BomCost.Status.KNOWN,
                hourlyRate == null ? null : calculateCost(hourlyRate),
                BigDecimal.valueOf(minutes.value()), "min", hourlyRate, null,
                hourlyRate == null ? List.of(new BomCost.Diagnostic(
                        "ACTIVITY_RATE_MISSING", type.name(),
                        "Taux horaire absent pour l'activité " + type.name(), true)) : List.of());
    }

}
