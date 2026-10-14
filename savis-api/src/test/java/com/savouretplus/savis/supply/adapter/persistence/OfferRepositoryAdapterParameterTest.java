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
