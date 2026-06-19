package com.savouretplus.savis.supply.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Repository;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.supply.domain.Offer;
import com.savouretplus.savis.supply.domain.OfferStatus;
import com.savouretplus.savis.supply.domain.Provider;
import com.savouretplus.savis.supply.port.OfferRepository;

import lombok.AllArgsConstructor;

/**
 * Persists supplier offers through Spring Data JPA.
 */
@Repository
@AllArgsConstructor
public class OfferRepositoryAdapter implements OfferRepository {

    private final OfferJpaRepository jpaRepository;

    /**
     * Finds an aggregate by its public identifier.
     */
    @Override
    public Optional<Offer> findByPublicId(UUID publicId) {
        return jpaRepository.findByPublicId(publicId)
                .map(this::toDomain);
    }

    /**
     * Finds an offer by its provider-specific identity.
     */
    @Override
    public Optional<Offer> findByExternalIdAndProviderIdentifier(String externalId, String providerIdentifier) {
        return jpaRepository.findByExternalIdAndProviderIdentifier(externalId, providerIdentifier)
                .map(this::toDomain);
    }

    /**
     * Finds available offers matching a component name.
     */
    @Override
    public List<Offer> searchAvailableByComponentName(String componentName) {
        return jpaRepository.findByStatusAndComponentNameContainingIgnoreCaseOrderByPriceAmountAsc(
                OfferStatus.AVAILABLE,
                componentName)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    /**
     * Persists the provided aggregate.
     */
    @Override
    public Offer save(Offer offer) {
        OfferEntity entity = jpaRepository.findByPublicId(offer.publicId())
                .or(() -> jpaRepository.findByExternalIdAndProviderIdentifier(
                        offer.externalId(),
                        offer.provider().identifier()))
                .orElseGet(OfferEntity::new);

        updateEntity(entity, offer);
        /**
         * Converts this DTO to its domain representation.
         */
        return toDomain(jpaRepository.save(entity));
    }

    private void updateEntity(OfferEntity entity, Offer offer) {
        entity.setPublicId(offer.publicId());
        entity.setExternalId(offer.externalId());
        entity.setUrl(offer.url());
        entity.setComponentName(offer.componentName());
        entity.setBrand(offer.brand());
        entity.setLabel(offer.label());
        entity.setImageUrl(offer.imageUrl());
        entity.setLastSeen(offer.lastSeen());
        entity.setStatus(offer.status());

        if (offer.price() != null) {
            entity.setPriceAmount(offer.price().amount());
            entity.setPriceCurrency(offer.price().currency());
        } else {
            entity.setPriceAmount(null);
            entity.setPriceCurrency(null);
        }

        if (offer.packageSize() != null) {
            entity.setPackageSizeValue(offer.packageSize().value());
            entity.setPackageSizeUnit(offer.packageSize().unit().getSymbole());
        } else {
            entity.setPackageSizeValue(null);
            entity.setPackageSizeUnit(null);
        }

        entity.setProvider(fromDomain(offer.provider()));
    }

    private Offer toDomain(OfferEntity entity) {
        Money price = entity.getPriceAmount() != null
                ? new Money(entity.getPriceAmount(), entity.getPriceCurrency())
                : null;
        Quantity packageSize = entity.getPackageSizeValue() != null
                ? new Quantity(entity.getPackageSizeValue(), Unit.fromSymbole(entity.getPackageSizeUnit()))
                : null;

        return new Offer(
                entity.getPublicId(),
                entity.getExternalId(),
                entity.getUrl(),
                entity.getComponentName(),
                entity.getBrand(),
                entity.getLabel(),
                entity.getImageUrl(),
                price,
                packageSize,
                toDomain(entity.getProvider()),
                entity.getLastSeen(),
                entity.getStatus());
    }

    private ProviderEntity fromDomain(Provider provider) {
        ProviderEntity entity = new ProviderEntity();
        entity.setName(provider.name());
        entity.setIdentifier(provider.identifier());
        entity.setSite(provider.site());
        entity.setAddress(provider.address());
        return entity;
    }

    private Provider toDomain(ProviderEntity entity) {
        return new Provider(
                entity.getName(),
                entity.getIdentifier(),
                entity.getSite(),
                entity.getAddress());
    }
}
