package com.savouretplus.savis.supply.api;

import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.supply.domain.Offer;

public record OfferPricing(
        UUID publicId,
        String brand,
        String label,
        Money price,
        Quantity packageSize) {

    public static OfferPricing from(Offer offer) {
        return new OfferPricing(offer.publicId(), offer.brand(), offer.label(), offer.price(), offer.packageSize());
    }
}
