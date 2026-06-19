package com.savouretplus.savis.supply.adapter.messaging;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.supply.domain.Offer;
import com.savouretplus.savis.supply.domain.OfferStatus;
import com.savouretplus.savis.supply.domain.Provider;

/**
 * Inbound message carrying offer data received from the supply crawler.
 */
public record OffersMessage(
        String id,
        List<OfferMessage> offers) {

    List<Offer> toOffers() {
        return offers.stream()
                .map(OfferMessage::toDomain)
                .toList();
    }

}

/**
 * Inbound message fragment carrying supplier price data.
 */
record PriceMessage(
        String amount,
        String currency) {

    Money toDomain() {
        return Money.of(amount, currency);
    }
}

/**
 * Inbound message fragment carrying package quantity data.
 */
record PackageSizeMessage(
        String value,
        String unit) {

    Quantity toDomain() {
        return new Quantity(Double.valueOf(value), Unit.fromSymbole(unit));
    }
}

/**
 * Inbound message fragment carrying supplier identity data.
 */
record ProviderMessage(
        String name,
        String identifier,
        String site,
        String address) {

    Provider toDomain() {
        return new Provider(name, identifier, site, address);
    }
}

/**
 * Inbound message fragment carrying one supplier offer.
 */
record OfferMessage(
        String id,
        @JsonProperty("external_id") String externalId,
        String url,
        String brand,
        String label,
        PriceMessage price,
        @JsonProperty("package_size") PackageSizeMessage packageSize,
        @JsonProperty("image_url") String imageUrl,
        @JsonProperty("search_term") String searchTerm,
        ProviderMessage provider) {

    Offer toDomain() {
        return new Offer(
                UUID.fromString(id),
                externalId,
                url,
                searchTerm,
                brand,
                label,
                imageUrl,
                price == null ? null :price.toDomain(),
                packageSize == null ? null :packageSize.toDomain(),
                provider.toDomain(),
                LocalDateTime.now(),
                OfferStatus.AVAILABLE);
    }
}
