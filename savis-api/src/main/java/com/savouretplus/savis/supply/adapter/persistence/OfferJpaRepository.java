package com.savouretplus.savis.supply.adapter.persistence;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface OfferJpaRepository extends JpaRepository<OfferEntity, Long> {

    Optional<OfferEntity> findByPublicId(UUID publicId);

    Optional<OfferEntity> findByExternalIdAndProviderIdentifier(String externalId, String providerIdentifier);
}
