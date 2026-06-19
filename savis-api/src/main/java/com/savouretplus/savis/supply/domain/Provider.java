package com.savouretplus.savis.supply.domain;

/**
 * Represents the supplier or store that provided an offer.
 */
public record Provider(
        String name,
        String identifier,
        String site,
        String address) {

}
