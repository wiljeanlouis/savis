package com.savouretplus.savis.supply.adapter.web;

import com.savouretplus.savis.supply.domain.OfferStatus;
import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.supply.domain.Offer;
import com.savouretplus.savis.supply.domain.Provider;
import com.savouretplus.savis.supply.port.OfferCatalogQuery;
import com.savouretplus.savis.supply.port.OfferCatalogSort;
import com.savouretplus.savis.supply.usecase.OfferService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller exposing supplier offer search endpoints.
 */
@Slf4j
@RestController
@RequestMapping({ "/api/supply/offers" })
@AllArgsConstructor
public class SupplyOfferController {

    private static final String DEFAULT_SORT = "lastSeen,desc";

    private final OfferService offerService;

    /**
     * Searches supplier offers for a component name.
     */
    @GetMapping
    public ResponseEntity<List<SupplyOfferDto>> searchOffers(
            @RequestParam String componentName) {
        log.info("Received request to search available offers for component: {}", componentName);

        List<SupplyOfferDto> offers = offerService.searchAvailableOffers(componentName)
                .stream()
                .map(SupplyOfferDto::from)
                .toList();

        return ResponseEntity.ok(offers);
    }

    /**
     * Lists persisted Supply offers using database-backed filtering and pagination.
     */
    @GetMapping("/catalog")
    public SupplyOfferCatalogResponse catalog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "AVAILABLE") String status,
            @RequestParam(defaultValue = DEFAULT_SORT) String sort) {
        OfferCatalogQuery query = new OfferCatalogQuery(
                page,
                size,
                search,
                parseStatus(status),
                parseSort(sort));

        return SupplyOfferCatalogResponse.from(offerService.searchOfferCatalog(query), page, size);
    }

    public record ManualOfferRequest(UUID resourceId, String externalId, String providerName,
            String providerIdentifier, String label, String brand, String url,
            BigDecimal price, String currency, double packageValue, String packageUnit) {}

    @PostMapping
    public ResponseEntity<SupplyOfferDto> create(@RequestBody ManualOfferRequest request) {
        if (request.price() == null || request.currency() == null || request.currency().isBlank()) {
            throw new IllegalArgumentException("Prix et devise requis");
        }
        var offer = new Offer(UUID.randomUUID(), request.externalId(),
                request.url(), "Saisie manuelle", request.brand(), request.label(), null,
                new Money(request.price(), request.currency()),
                new Quantity(request.packageValue(),
                        Unit.fromSymbole(request.packageUnit())),
                new Provider(request.providerName(), request.providerIdentifier(), null, null),
                LocalDateTime.now(), OfferStatus.AVAILABLE, request.resourceId());
        return ResponseEntity.status(201).body(SupplyOfferDto.from(offerService.createManualOffer(offer)));
    }

    public record AssociationRequest(UUID resourceId) {}

    @PutMapping("/{offerId}/resource")
    public SupplyOfferDto associate(@PathVariable UUID offerId, @RequestBody AssociationRequest request) {
        return SupplyOfferDto.from(offerService.associate(offerId, request.resourceId()));
    }

    @GetMapping("/resource/{resourceId}")
    public List<SupplyOfferDto> resourceOffers(@PathVariable UUID resourceId,
            @RequestParam(defaultValue = "false") boolean availableOnly) {
        return offerService.resourceOffers(resourceId).stream()
                .filter(offer -> !availableOnly || offer.status() == OfferStatus.AVAILABLE).map(SupplyOfferDto::from).toList();
    }

    private OfferStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Le statut des offres est requis");
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if ("ALL".equals(normalized)) {
            return null;
        }
        try {
            return OfferStatus.valueOf(normalized);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException(
                    "Le statut doit être AVAILABLE, UNAVAILABLE ou ALL", exception);
        }
    }

    private OfferCatalogSort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            throw new IllegalArgumentException("Le tri des offres est requis");
        }
        return switch (sort.trim()) {
            case "lastSeen,asc" -> OfferCatalogSort.LAST_SEEN_ASC;
            case DEFAULT_SORT -> OfferCatalogSort.LAST_SEEN_DESC;
            case "componentName,asc" -> OfferCatalogSort.COMPONENT_NAME_ASC;
            case "componentName,desc" -> OfferCatalogSort.COMPONENT_NAME_DESC;
            case "price,asc" -> OfferCatalogSort.PRICE_ASC;
            case "price,desc" -> OfferCatalogSort.PRICE_DESC;
            default -> throw new IllegalArgumentException(
                    "Tri invalide. Valeurs permises: lastSeen,asc, lastSeen,desc, "
                            + "componentName,asc, componentName,desc, price,asc, price,desc");
        };
    }
}
