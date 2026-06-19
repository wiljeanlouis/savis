package com.savouretplus.savis.supply.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.supply.domain.Offer;

/**
 * Defines persistence operations for supplier offers.
 */
public interface OfferRepository {

    /**
     * Finds an aggregate by its public identifier.
     */
    Optional<Offer> findByPublicId(UUID publicId);

    /**
     * Finds an offer by its provider-specific identity.
     */
    Optional<Offer> findByExternalIdAndProviderIdentifier(String externalId, String providerIdentifier);

    /**
     * Finds available offers matching a component name.
     */
    List<Offer> searchAvailableByComponentName(String componentName);

    /**
     * Persists the provided aggregate.
     */
    Offer save(Offer offer);

}
