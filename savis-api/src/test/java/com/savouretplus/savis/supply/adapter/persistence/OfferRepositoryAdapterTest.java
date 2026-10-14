package com.savouretplus.savis.supply.adapter.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.supply.domain.Offer;
import com.savouretplus.savis.supply.domain.OfferStatus;
import com.savouretplus.savis.supply.domain.Provider;
import com.savouretplus.savis.supply.port.OfferCatalogQuery;
import com.savouretplus.savis.supply.port.OfferCatalogSort;
import com.savouretplus.savis.supply.port.OfferRepository;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class OfferRepositoryAdapterTest {
    private static final LocalDateTime OBSERVED_AT = LocalDateTime.parse("2026-10-14T12:00:00");

    @Autowired OfferRepository repository;

    @Test
    void filtersAvailableUnavailableAndAllOffers() {
        Offer available = save("00000000-0000-4000-8000-000000000001", "farine", OfferStatus.AVAILABLE);
        Offer unavailable = save("00000000-0000-4000-8000-000000000002", "sucre", OfferStatus.UNAVAILABLE);

        assertEquals(List.of(available), query(null, OfferStatus.AVAILABLE, 0, 20).content());
        assertEquals(List.of(unavailable), query(null, OfferStatus.UNAVAILABLE, 0, 20).content());
        assertEquals(2, query(null, null, 0, 20).totalElements());
    }

    @Test
    void searchesEverySupportedFieldIgnoringCase() {
        saveDetailed(
                "00000000-0000-4000-8000-000000000010",
                "Farine blanche",
                "Farine tout usage",
                "Sans Nom",
                "Marché Maxi",
                "maxi",
                OfferStatus.AVAILABLE,
                new BigDecimal("3.75"));

        for (String search : List.of("FARINE BLANCHE", "TOUT USAGE", "sans nom", "MARCHÉ MAXI", "MAXI")) {
            assertEquals(1, query(search, OfferStatus.AVAILABLE, 0, 20).totalElements(), search);
        }
        assertEquals(0, query("introuvable", OfferStatus.AVAILABLE, 0, 20).totalElements());
    }

    @Test
    void paginatesInStablePublicIdOrderAndPreservesExactPrice() {
        saveDetailed(
                "00000000-0000-4000-8000-000000000003",
                "farine",
                "C",
                null,
                "Maxi",
                "maxi",
                OfferStatus.AVAILABLE,
                new BigDecimal("12.30"));
        saveDetailed(
                "00000000-0000-4000-8000-000000000001",
                "farine",
                "A",
                null,
                "Maxi",
                "maxi",
                OfferStatus.AVAILABLE,
                new BigDecimal("10.10"));
        saveDetailed(
                "00000000-0000-4000-8000-000000000002",
                "farine",
                "B",
                null,
                "Maxi",
                "maxi",
                OfferStatus.AVAILABLE,
                new BigDecimal("11.20"));

        var firstPage = query("farine", OfferStatus.AVAILABLE, 0, 2);
        var secondPage = query("farine", OfferStatus.AVAILABLE, 1, 2);

        assertEquals(3, firstPage.totalElements());
        assertEquals(2, firstPage.totalPages());
        assertEquals(List.of(
                UUID.fromString("00000000-0000-4000-8000-000000000001"),
                UUID.fromString("00000000-0000-4000-8000-000000000002")),
                firstPage.content().stream().map(Offer::publicId).toList());
        assertEquals(UUID.fromString("00000000-0000-4000-8000-000000000003"),
                secondPage.content().getFirst().publicId());
        assertEquals(new BigDecimal("10.10"), firstPage.content().getFirst().price().amount());
        assertEquals("CAD", firstPage.content().getFirst().price().currency());
    }

    @Test
    void returnsAnEmptyPageWhenNoOfferMatches() {
        var page = query(null, OfferStatus.AVAILABLE, 0, 20);

        assertTrue(page.content().isEmpty());
        assertEquals(0, page.totalElements());
        assertEquals(0, page.totalPages());
    }

    private com.savouretplus.savis.supply.port.OfferCatalogPage query(
            String search,
            OfferStatus status,
            int page,
            int size) {
        return repository.searchCatalog(new OfferCatalogQuery(
                page, size, search, status, OfferCatalogSort.COMPONENT_NAME_ASC));
    }

    private Offer save(String id, String componentName, OfferStatus status) {
        return saveDetailed(id, componentName, componentName, "Marque", "Maxi", "maxi", status,
                new BigDecimal("3.75"));
    }

    private Offer saveDetailed(
            String id,
            String componentName,
            String label,
            String brand,
            String providerName,
            String providerIdentifier,
            OfferStatus status,
            BigDecimal price) {
        UUID publicId = UUID.fromString(id);
        return repository.save(new Offer(
                publicId,
                "external-" + publicId,
                "https://example.com/products/" + publicId,
                componentName,
                brand,
                label,
                null,
                new Money(price, "CAD"),
                new Quantity(1, Unit.KILOGRAM),
                new Provider(providerName, providerIdentifier, "https://example.com", null),
                OBSERVED_AT,
                status));
    }
}
