package com.savouretplus.savis.supply.adapter.persistence;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;

import com.savouretplus.savis.supply.domain.OfferStatus;
import com.savouretplus.savis.supply.port.OfferCatalogQuery;
import com.savouretplus.savis.supply.port.OfferCatalogSort;

class OfferRepositoryAdapterParameterTest {

    @Test
    void refreshPreservesPublicIdentityAndValidatedResourceAssociation() {
        OfferJpaRepository jpa = mock(OfferJpaRepository.class);
        var entity = new OfferEntity();
        var originalId = java.util.UUID.randomUUID();
        var resourceId = java.util.UUID.randomUUID();
        entity.setPublicId(originalId);
        entity.setResourceId(resourceId);
        when(jpa.findByExternalIdAndProviderIdentifier("external", "provider"))
                .thenReturn(java.util.Optional.of(entity));
        when(jpa.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var observed = java.time.LocalDateTime.now();
        var incoming = new com.savouretplus.savis.supply.domain.Offer(java.util.UUID.randomUUID(),
                "external", "https://example.com", "Recherche", "Marque", "Produit", null,
                com.savouretplus.savis.common.Money.of(3.75),
                new com.savouretplus.savis.common.Quantity(2, com.savouretplus.savis.common.Unit.KILOGRAM),
                new com.savouretplus.savis.supply.domain.Provider("Fournisseur", "provider", null, null),
                observed, OfferStatus.AVAILABLE);
        var saved = new OfferRepositoryAdapter(jpa).save(incoming);
        org.junit.jupiter.api.Assertions.assertEquals(originalId, saved.publicId());
        org.junit.jupiter.api.Assertions.assertEquals(resourceId, saved.resourceId());
        org.junit.jupiter.api.Assertions.assertEquals(incoming.price(), saved.price());
        org.junit.jupiter.api.Assertions.assertEquals(incoming.packageSize(), saved.packageSize());
        org.junit.jupiter.api.Assertions.assertEquals(observed, saved.lastSeen());
    }

    @Test
    void replacesAnAbsentSearchWithATypedEmptyString() {
        OfferJpaRepository jpaRepository = mock(OfferJpaRepository.class);
        when(jpaRepository.searchCatalog(eq(""), eq(OfferStatus.AVAILABLE), any()))
                .thenReturn(Page.empty());
        OfferRepositoryAdapter repository = new OfferRepositoryAdapter(jpaRepository);

        repository.searchCatalog(new OfferCatalogQuery(
                0,
                20,
                null,
                OfferStatus.AVAILABLE,
                OfferCatalogSort.LAST_SEEN_DESC));

        verify(jpaRepository).searchCatalog(eq(""), eq(OfferStatus.AVAILABLE), any());
    }
}
