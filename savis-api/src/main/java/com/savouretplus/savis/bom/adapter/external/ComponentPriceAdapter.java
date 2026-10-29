package com.savouretplus.savis.bom.adapter.external;

import com.savouretplus.savis.bom.domain.BomCost.Diagnostic;
import com.savouretplus.savis.bom.domain.BomCost.Source;
import com.savouretplus.savis.bom.port.ComponentPrice;
import com.savouretplus.savis.bom.port.ComponentPricePort;
import com.savouretplus.savis.bom.port.ComponentPriceRequest;
import com.savouretplus.savis.supply.api.OfferPricing;
import com.savouretplus.savis.supply.api.SupplyApi;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

record CheapestOfferKey(UUID resourceId, String baseUnit) {}

/** Preserves selection and batching; technical exceptions intentionally propagate. */
@Component
@AllArgsConstructor
class ComponentPriceAdapter implements ComponentPricePort {
    private final SupplyApi supplyApi;

    @Override
    public ComponentPrice getPrice(ComponentPriceRequest request) {
        return getPrices(List.of(request)).get(request);
    }

    @Override
    public Map<ComponentPriceRequest, ComponentPrice> getPrices(List<ComponentPriceRequest> requests) {
        Map<ComponentPriceRequest, ComponentPrice> prices = new LinkedHashMap<>();
        Map<UUID, Optional<OfferPricing>> selectedCache = new LinkedHashMap<>();
        Map<CheapestOfferKey, Optional<OfferPricing>> cheapestCache = new LinkedHashMap<>();
        var resourceIds = requests.stream().map(ComponentPriceRequest::resourceId)
                .filter(Objects::nonNull).collect(Collectors.toSet());
        var offerIds = requests.stream().map(ComponentPriceRequest::selectedOfferId)
                .filter(Objects::nonNull).collect(Collectors.toSet());
        var candidates = supplyApi.getPricingCandidates(resourceIds, offerIds);
        for (ComponentPriceRequest request : requests.stream().distinct().toList()) {
            List<Diagnostic> diagnostics = new ArrayList<>();
            Optional<OfferPricing> offer = Optional.empty();
            if (request.selectedOfferId() != null) {
                offer = selectedCache.computeIfAbsent(request.selectedOfferId(), id -> candidates.stream().filter(o -> id.equals(o.publicId())).findFirst());
                if (offer.isEmpty()) {
                    diagnostics.add(diagnostic(request, "SELECTED_OFFER_NOT_FOUND",
                            "Offre sélectionnée introuvable; recherche de l'offre compatible la moins chère", false));
                }
            }
            if (offer.isEmpty()) {
                CheapestOfferKey key = new CheapestOfferKey(request.resourceId(), request.quantity().unit().baseUnit());
                offer = cheapestCache.computeIfAbsent(key,
                        ignored -> candidates.stream()
                                .filter(o -> request.resourceId() != null && request.resourceId().equals(o.resourceId()))
                                .filter(o -> "AVAILABLE".equals(o.availability()) && o.price() != null
                                        && o.packageSize() != null && o.packageSize().unit() != null
                                        && Double.isFinite(o.packageSize().value()) && o.packageSize().value() > 0
                                        && request.quantity().isCompatibleWith(o.packageSize()))
                                .min(Comparator.comparing(o -> o.price().amount().divide(
                                        o.packageSize().baseValue(), 10, RoundingMode.HALF_UP))));
            }
            if (offer.isEmpty()) {
                diagnostics.add(diagnostic(request, "OFFER_NOT_FOUND",
                        "Aucune offre disponible et compatible avec un prix et un conditionnement valides", true));
                prices.put(request, new ComponentPrice(null,
                        new Source(request.selectedOfferId(), null, null, null, null), diagnostics));
            } else {
                prices.put(request, calculatePrice(request, offer.get(), diagnostics));
            }
        }
        return Map.copyOf(prices);
    }

    private ComponentPrice calculatePrice(ComponentPriceRequest request, OfferPricing offer,
            List<Diagnostic> diagnostics) {
        Source source = new Source(request.selectedOfferId(), offer.publicId(), offer.observedAt(),
                offer.price(), offer.packageSize());
        if (request.resourceId() == null || !request.resourceId().equals(offer.resourceId())) {
            diagnostics.add(diagnostic(request, "OFFER_RESOURCE_MISMATCH",
                    "L'offre sélectionnée n'appartient pas à la ressource du composant", true));
        }
        // Existing behavior: a resolved selected offer remains the reference even when unavailable.
        if ("UNAVAILABLE".equals(offer.availability())) {
            diagnostics.add(diagnostic(request, "SELECTED_OFFER_UNAVAILABLE",
                    "Offre sélectionnée indisponible; dernier prix observé conservé, sans repli automatique", false));
        } else if (!"AVAILABLE".equals(offer.availability())) {
            diagnostics.add(diagnostic(request, "OFFER_AVAILABILITY_UNKNOWN",
                    "Disponibilité de l'offre inconnue", false));
        }
        if (offer.price() == null) {
            diagnostics.add(diagnostic(request, "OFFER_PRICE_MISSING", "Prix de l'offre absent", true));
        }
        boolean validPackage = offer.packageSize() != null && offer.packageSize().unit() != null
                && Double.isFinite(offer.packageSize().value()) && offer.packageSize().value() > 0;
        if (!validPackage) {
            diagnostics.add(diagnostic(request, "INVALID_PACKAGE", "Conditionnement absent ou invalide", true));
        } else if (!request.quantity().isCompatibleWith(offer.packageSize())) {
            diagnostics.add(diagnostic(request, "INCOMPATIBLE_UNITS", "Unités du composant et de l'offre incompatibles", true));
        }
        if (diagnostics.stream().anyMatch(Diagnostic::blocking)) {
            return new ComponentPrice(null, source, diagnostics);
        }
        BigDecimal ratio = request.quantity().baseValue().divide(offer.packageSize().baseValue(), 10, RoundingMode.HALF_UP);
        return new ComponentPrice(offer.price().multiply(ratio), source, diagnostics);
    }

    private Diagnostic diagnostic(ComponentPriceRequest request, String code, String message, boolean blocking) {
        return new Diagnostic(code, request.componentName(), message, blocking);
    }
}
