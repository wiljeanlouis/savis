package com.savouretplus.savis.supply.adapter.web;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.supply.domain.Offer;
import com.savouretplus.savis.supply.domain.OfferStatus;
import com.savouretplus.savis.supply.domain.Provider;
import com.savouretplus.savis.supply.port.OfferCatalogPage;

/** Paged HTTP representation of the persisted Supply offer catalog. */
public record SupplyOfferCatalogResponse(
        List<OfferDto> content,
        int page,
        int size,
        long totalElements,
        int totalPages) {

    /** Maps a repository page without changing monetary precision. */
    static SupplyOfferCatalogResponse from(OfferCatalogPage result, int page, int size) {
        return new SupplyOfferCatalogResponse(
                result.content().stream().map(OfferDto::from).toList(),
                page,
                size,
                result.totalElements(),
                result.totalPages());
    }

    /** Read-only representation of one supplier offer. */
    public record OfferDto(
            UUID id,
            String componentName,
            String label,
            String brand,
            String imageUrl,
            String url,
            ProviderDto provider,
            PriceDto price,
            PackageSizeDto packageSize,
            OfferStatus status,
            LocalDateTime lastSeen) {

        static OfferDto from(Offer offer) {
            return new OfferDto(
                    offer.publicId(),
                    offer.componentName(),
                    offer.label(),
                    offer.brand(),
                    offer.imageUrl(),
                    offer.url(),
                    ProviderDto.from(offer.provider()),
                    PriceDto.from(offer.price()),
                    PackageSizeDto.from(offer.packageSize()),
                    offer.status(),
                    offer.lastSeen());
        }
    }

    /** Public supplier coordinates included in an offer. */
    public record ProviderDto(String name, String identifier, String site) {
        static ProviderDto from(Provider provider) {
            return provider == null
                    ? null
                    : new ProviderDto(provider.name(), provider.identifier(), provider.site());
        }
    }

    /** Exact monetary amount expressed in its source currency. */
    public record PriceDto(BigDecimal amount, String currency) {
        static PriceDto from(Money price) {
            return price == null ? null : new PriceDto(price.amount(), price.currency());
        }
    }

    /** Package quantity expressed using the unit stored by Supply. */
    public record PackageSizeDto(double value, String unit) {
        static PackageSizeDto from(Quantity packageSize) {
            return packageSize == null
                    ? null
                    : new PackageSizeDto(packageSize.value(), packageSize.unit().getSymbole());
        }
    }
}
