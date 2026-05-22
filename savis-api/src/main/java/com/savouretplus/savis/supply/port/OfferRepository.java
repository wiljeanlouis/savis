package com.savouretplus.savis.supply.port;

import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.supply.domain.Offer;

public interface OfferRepository {

    Optional<Offer> findByPublicId(UUID publicId);

    Optional<Offer> findByExternalIdAndProviderIdentifier(String externalId, String providerIdentifier);

    Offer save(Offer offer);

}
