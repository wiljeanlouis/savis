package com.savouretplus.savis.bom.port;

import java.util.List;
import com.savouretplus.savis.bom.domain.BomCost.Diagnostic;
import com.savouretplus.savis.bom.domain.BomCost.Source;
import com.savouretplus.savis.common.Money;

/** An absent amount is an expected valuation failure, never an implicit zero. */
public record ComponentPrice(Money amount, Source source, List<Diagnostic> diagnostics) {
    public ComponentPrice {
        diagnostics = List.copyOf(diagnostics);
        if (amount == null && diagnostics.stream().noneMatch(Diagnostic::blocking)) {
            throw new IllegalArgumentException("Un prix manquant doit être expliqué");
        }
    }
}
