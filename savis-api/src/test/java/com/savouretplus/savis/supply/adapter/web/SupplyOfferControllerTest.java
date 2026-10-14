package com.savouretplus.savis.supply.adapter.web;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.supply.domain.Offer;
import com.savouretplus.savis.supply.domain.OfferStatus;
import com.savouretplus.savis.supply.domain.Provider;
import com.savouretplus.savis.supply.port.OfferCatalogPage;
import com.savouretplus.savis.supply.port.OfferCatalogQuery;
import com.savouretplus.savis.supply.port.OfferCatalogSort;
import com.savouretplus.savis.supply.usecase.OfferService;

@ExtendWith(MockitoExtension.class)
class SupplyOfferControllerTest {
    private static final UUID OFFER_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");

    @Mock OfferService offers;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new SupplyOfferController(offers))
                .setControllerAdvice(new SupplyOfferExceptionHandler())
                .build();
    }

    @Test
    void listsAvailableOffersByDefaultWithExactMonetaryValues() throws Exception {
        when(offers.searchOfferCatalog(any())).thenReturn(new OfferCatalogPage(List.of(completeOffer()), 1, 1));

        mockMvc.perform(get("/api/supply/offers/catalog"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.content[0].id").value(OFFER_ID.toString()))
                .andExpect(jsonPath("$.content[0].provider.identifier").value("maxi"))
                .andExpect(jsonPath("$.content[0].price.currency").value("CAD"))
                .andExpect(jsonPath("$.content[0].status").value("AVAILABLE"))
                .andExpect(content().string(containsString("\"amount\":1234567890.12")));

        ArgumentCaptor<OfferCatalogQuery> query = ArgumentCaptor.forClass(OfferCatalogQuery.class);
        verify(offers).searchOfferCatalog(query.capture());
        org.junit.jupiter.api.Assertions.assertEquals(OfferStatus.AVAILABLE, query.getValue().status());
        org.junit.jupiter.api.Assertions.assertEquals(OfferCatalogSort.LAST_SEEN_DESC, query.getValue().sort());
    }

    @Test
    void acceptsUnavailableAndAllStatusesAndNormalizesSearch() throws Exception {
        when(offers.searchOfferCatalog(any())).thenReturn(new OfferCatalogPage(List.of(), 0, 0));

        mockMvc.perform(get("/api/supply/offers/catalog")
                        .param("status", "UNAVAILABLE")
                        .param("search", "  Farine  ")
                        .param("sort", "price,asc"))
                .andExpect(status().isOk());

        ArgumentCaptor<OfferCatalogQuery> unavailable = ArgumentCaptor.forClass(OfferCatalogQuery.class);
        verify(offers).searchOfferCatalog(unavailable.capture());
        org.junit.jupiter.api.Assertions.assertEquals(OfferStatus.UNAVAILABLE, unavailable.getValue().status());
        org.junit.jupiter.api.Assertions.assertEquals("Farine", unavailable.getValue().search());
        org.junit.jupiter.api.Assertions.assertEquals(OfferCatalogSort.PRICE_ASC, unavailable.getValue().sort());

        org.mockito.Mockito.clearInvocations(offers);
        mockMvc.perform(get("/api/supply/offers/catalog").param("status", "ALL"))
                .andExpect(status().isOk());

        ArgumentCaptor<OfferCatalogQuery> all = ArgumentCaptor.forClass(OfferCatalogQuery.class);
        verify(offers).searchOfferCatalog(all.capture());
        org.junit.jupiter.api.Assertions.assertNull(all.getValue().status());
    }

    @Test
    void serializesAbsentOptionalFieldsAsNull() throws Exception {
        Offer partial = new Offer(
                OFFER_ID, "external", null, "farine", null, null, null,
                null, null, new Provider("Maxi", "maxi", null, null),
                null, OfferStatus.AVAILABLE);
        when(offers.searchOfferCatalog(any())).thenReturn(new OfferCatalogPage(List.of(partial), 1, 1));

        mockMvc.perform(get("/api/supply/offers/catalog"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].label").isEmpty())
                .andExpect(jsonPath("$.content[0].brand").isEmpty())
                .andExpect(jsonPath("$.content[0].imageUrl").isEmpty())
                .andExpect(jsonPath("$.content[0].price").isEmpty())
                .andExpect(jsonPath("$.content[0].packageSize").isEmpty())
                .andExpect(jsonPath("$.content[0].lastSeen").isEmpty());
    }

    @Test
    void rejectsInvalidCatalogParametersWithBadRequest() throws Exception {
        for (String query : List.of(
                "?page=-1",
                "?page=abc",
                "?size=0",
                "?size=101",
                "?status=ARCHIVED",
                "?sort=provider,asc")) {
            mockMvc.perform(get("/api/supply/offers/catalog" + query))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void preservesTheExistingComponentSearchContract() throws Exception {
        when(offers.searchAvailableOffers("farine")).thenReturn(List.of(completeOffer()));

        mockMvc.perform(get("/api/supply/offers").param("componentName", "farine"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(OFFER_ID.toString()))
                .andExpect(jsonPath("$[0].componentName").value("farine"))
                .andExpect(jsonPath("$[0].status").doesNotExist())
                .andExpect(jsonPath("$[0].lastSeen").doesNotExist());

        verify(offers).searchAvailableOffers("farine");
    }

    private Offer completeOffer() {
        return new Offer(
                OFFER_ID,
                "external",
                "https://example.com/farine",
                "farine",
                "Sans nom",
                "Farine tout usage",
                "https://example.com/farine.jpg",
                new Money(new BigDecimal("1234567890.12"), "CAD"),
                new Quantity(2.5, Unit.KILOGRAM),
                new Provider("Maxi", "maxi", "https://maxi.ca", null),
                LocalDateTime.parse("2026-10-14T12:00:00"),
                OfferStatus.AVAILABLE);
    }
}
