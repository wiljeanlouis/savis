package com.savouretplus.savis.supply.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    /**
     * Searches catalog fields while leaving filtering and pagination in the database.
     */
    @Query("""
            select offer
            from offers offer
            where (:status is null or offer.status = :status)
              and (:search = ''
                   or lower(offer.componentName) like lower(concat('%', :search, '%'))
                   or lower(offer.label) like lower(concat('%', :search, '%'))
                   or lower(offer.brand) like lower(concat('%', :search, '%'))
                   or lower(offer.provider.name) like lower(concat('%', :search, '%'))
                   or lower(offer.provider.identifier) like lower(concat('%', :search, '%')))
            """)
    Page<OfferEntity> searchCatalog(
            @Param("search") String search,
            @Param("status") OfferStatus status,
            Pageable pageable);
}
