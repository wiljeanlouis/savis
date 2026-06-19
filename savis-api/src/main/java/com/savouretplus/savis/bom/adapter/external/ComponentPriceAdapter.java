package com.savouretplus.savis.bom.adapter.external;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.bom.port.ComponentPricePort;
import com.savouretplus.savis.bom.port.ComponentPriceRequest;
import com.savouretplus.savis.supply.api.OfferPricing;
import com.savouretplus.savis.supply.api.SupplyApi;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Groups cheapest-offer lookups by component name and base unit.
 */
record CheapestOfferKey(String componentName, String baseUnit) {
}

/**
 * Adapts supply offers into BOM component prices.
 */
@Slf4j
@Component
@AllArgsConstructor
class ComponentPriceAdapter implements ComponentPricePort {
    private final SupplyApi supplyApi;

    /**
     * Returns the calculated price for one component price request.
     */
    @Override
    public Money getPrice(ComponentPriceRequest request) {
        /**
         * Returns the prices.
         */
        return getPrices(List.of(request)).getOrDefault(request, Money.ZERO);
    }

    /**
     * Returns calculated prices for multiple component price requests.
     */
    @Override
    public Map<ComponentPriceRequest, Money> getPrices(List<ComponentPriceRequest> requests) {
        Map<ComponentPriceRequest, Money> prices = new LinkedHashMap<>();
        Map<UUID, Optional<OfferPricing>> selectedOfferCache = new LinkedHashMap<>();
        Map<CheapestOfferKey, Optional<OfferPricing>> cheapestOfferCache = new LinkedHashMap<>();

        requests.stream().distinct().forEach(request -> {
            Money price = findOffer(request, selectedOfferCache, cheapestOfferCache)
                    .map(offer -> calculatePrice(offer, request.quantity()))
                    .orElse(Money.ZERO);

            prices.put(request, price);
        });

        return prices;
    }

    /**
     * Finds the selected offer first, then falls back to the cheapest compatible offer.
     */
    private Optional<OfferPricing> findOffer(
            ComponentPriceRequest request,
            Map<UUID, Optional<OfferPricing>> selectedOfferCache,
            Map<CheapestOfferKey, Optional<OfferPricing>> cheapestOfferCache) {
        if (request.selectedOfferId() != null) {
            Optional<OfferPricing> selectedOffer = selectedOfferCache.computeIfAbsent(
                    request.selectedOfferId(),
                    supplyApi::getOfferPricing);

            if (selectedOffer.isPresent()) {
                return selectedOffer;
            }
        }

        CheapestOfferKey key = new CheapestOfferKey(
                request.componentName(),
                request.quantity().unit().baseUnit());

        return cheapestOfferCache.computeIfAbsent(
                key,
                ignored -> supplyApi.getCheapestOfferPricing(request.componentName(), request.quantity()));
    }

    /**
     * Calculates a proportional component price from an offer package size.
     */
    private Money calculatePrice(OfferPricing offerPricing, Quantity quantity) {
        log.info("Calculate price of {} of {}", quantity, offerPricing);
        if (offerPricing.price() == null || offerPricing.packageSize() == null) {
            return Money.ZERO;
        }

        if (!quantity.isCompatibleWith(offerPricing.packageSize())) {
            throw new IllegalArgumentException("Unités incompatibles pour le calcul du prix");
        }

        if (offerPricing.packageSize().baseValue().compareTo(BigDecimal.ZERO) == 0) {
            return Money.ZERO;
        }

        BigDecimal ratio = quantity.baseValue().divide(offerPricing.packageSize().baseValue(), 10,
                RoundingMode.HALF_UP);
        return offerPricing.price().multiply(ratio);
    }

}
