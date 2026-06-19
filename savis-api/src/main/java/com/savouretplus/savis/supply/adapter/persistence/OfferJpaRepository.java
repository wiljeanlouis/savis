package com.savouretplus.savis.supply.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.savouretplus.savis.supply.domain.OfferStatus;

/**
 * Spring Data repository for supplier offer entities.
 */
interface OfferJpaRepository extends JpaRepository<OfferEntity, Long> {

    /**
     * Finds an aggregate by its public identifier.
     */
    Optional<OfferEntity> findByPublicId(UUID publicId);

    /**
     * Finds an offer by its provider-specific identity.
     */
    Optional<OfferEntity> findByExternalIdAndProviderIdentifier(String externalId, String providerIdentifier);

    /**
     * Finds a value by status and component name containing ignore case order by price amount asc.
     */
    List<OfferEntity> findByStatusAndComponentNameContainingIgnoreCaseOrderByPriceAmountAsc(
            OfferStatus status,
            String componentName);
}
