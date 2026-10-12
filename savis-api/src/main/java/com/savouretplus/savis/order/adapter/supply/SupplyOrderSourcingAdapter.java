package com.savouretplus.savis.order.adapter.supply;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.order.port.OrderSourcing;
import com.savouretplus.savis.supply.api.OfferPricing;
import com.savouretplus.savis.supply.api.SupplyApi;

import lombok.AllArgsConstructor;

/**
 * Resolves current supplier offers through the Supply public API.
 */
@Component
@AllArgsConstructor
public class SupplyOrderSourcingAdapter implements OrderSourcing {
    private final SupplyApi supply;

    /**
     * Uses the BOM-selected offer first and otherwise the cheapest compatible offer.
     */
    @Override
    public Optional<SourcingInformation> findCurrent(
            String componentName,
            BigDecimal requiredQuantity,
            Unit unit,
            UUID selectedOfferId) {
        Quantity requested = new Quantity(requiredQuantity.doubleValue(), unit);
        Optional<OfferPricing> selected = selectedOfferId == null
                ? Optional.empty()
                : supply.getOfferPricing(selectedOfferId)
                        .filter(offer -> compatible(requested, offer));
        return selected
                .or(() -> supply.getCheapestOfferPricing(componentName, requested))
                .map(this::toSourcingInformation);
    }

    private boolean compatible(Quantity requested, OfferPricing offer) {
        return offer.packageSize() != null && requested.isCompatibleWith(offer.packageSize());
    }

    private SourcingInformation toSourcingInformation(OfferPricing offer) {
        Quantity packageSize = offer.packageSize();
        String productName = firstNonBlank(offer.label(), offer.componentName());
        return new SourcingInformation(
                offer.publicId(),
                productName,
                offer.imageUrl(),
                firstNonBlank(offer.brand(), offer.label()),
                offer.supplierName(),
                packageSize == null ? null : BigDecimal.valueOf(packageSize.value()).stripTrailingZeros(),
                packageSize == null ? null : packageSize.unit(),
                offer.price(),
                offer.observedAt());
    }

    private String firstNonBlank(String preferred, String fallback) {
        return preferred != null && !preferred.isBlank() ? preferred : fallback;
    }
}
