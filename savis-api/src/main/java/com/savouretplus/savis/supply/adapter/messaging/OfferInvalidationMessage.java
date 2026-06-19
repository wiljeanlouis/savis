package com.savouretplus.savis.supply.adapter.messaging;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Inbound message identifying a supplier offer that should be invalidated.
 */
public record OfferInvalidationMessage(
        String id,
        @JsonProperty("external_id") String externalId,
        @JsonProperty("provider_identifier") String providerIdentifier) {

    UUID toOfferUuid(){
        return UUID.fromString(id);
    }
}
