package com.savouretplus.savis.supply.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.savouretplus.savis.supply.domain.OfferStatus;

interface OfferJpaRepository extends JpaRepository<OfferEntity, Long> {

    Optional<OfferEntity> findByPublicId(UUID publicId);

    Optional<OfferEntity> findByExternalIdAndProviderIdentifier(String externalId, String providerIdentifier);

    List<OfferEntity> findByStatusAndComponentNameContainingIgnoreCaseOrderByPriceAmountAsc(
            OfferStatus status,
            String componentName);
}
