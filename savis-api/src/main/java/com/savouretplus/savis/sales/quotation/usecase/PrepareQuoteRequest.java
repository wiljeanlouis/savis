package com.savouretplus.savis.sales.quotation.usecase;

import java.util.*;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.savouretplus.savis.catalog.api.CatalogOrderingApi;
import com.savouretplus.savis.sales.quotation.domain.*;
import com.savouretplus.savis.sales.quotation.port.QuoteRequestSelections;

/** Read-only, deterministic preparation. Saved operator decisions always win. */
@Service
@RequiredArgsConstructor
public class PrepareQuoteRequest {
    private final QuoteRequestSelections selections;
    private final CatalogOrderingApi catalog;

    public Preparation execute(QuoteRequest request) {
        var needs = new ArrayList<Need>();
        var proposed = new ArrayList<QuoteRequestQualification.Line>();
        var originals = selections.read(request);
        for (var original : originals) {
            var line = original.line();
            String name = null;
            State state = State.UNRESOLVED;
            String issue = original.issue();
            if (original.productId() != null) {
                try {
                    var identity = catalog.identify(original.productId());
                    name = identity.productName();
                    state = State.REVIEW;
                    if (!identity.available()) issue = "Le produit n’est plus disponible";
                    else if (line != null) {
                        try {
                            catalog.snapshot(new CatalogOrderingApi.ProductSelection(line.productId(), line.purchaseModeCode(), line.choiceCode(),
                                    line.allocations().stream().map(a -> new CatalogOrderingApi.ChoiceAllocation(a.choiceCode(), a.quantity())).toList(),
                                    line.ingredients().stream().map(i -> new CatalogOrderingApi.IngredientSelection(i.ingredientCode(), i.quantity())).toList()));
                            state = State.RECOGNIZED;
                        } catch (IllegalArgumentException error) { issue = error.getMessage(); }
                    }
                } catch (IllegalArgumentException error) { issue = "Aucun produit Catalog ne correspond à cette référence"; }
                if (state == State.RECOGNIZED) proposed.add(line);
            }
            needs.add(new Need(original.needKey(), original.requestedName(), name, state, issue, line));
        }
        request.needKeys().stream().filter(key -> !key.startsWith("item:")).sorted()
                .forEach(key -> needs.add(new Need(key, null, null, State.CUSTOM, "Besoin libre à préparer", null)));
        var qualification = request.qualification() != null ? request.qualification() : new QuoteRequestQualification(
                request.customerName(), request.customerPhone(), request.customerEmail(), null, proposed, Map.of());
        return new Preparation(qualification, List.copyOf(needs), request.qualification() != null);
    }

    public enum State { RECOGNIZED, REVIEW, UNRESOLVED, CUSTOM }
    public record Need(String needKey, String requestedName, String productName, State state, String issue,
            QuoteRequestQualification.Line requestedLine) {}
    public record Preparation(QuoteRequestQualification qualification, List<Need> needs, boolean saved) {}
}
