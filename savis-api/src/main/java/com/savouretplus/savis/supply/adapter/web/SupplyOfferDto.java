package com.savouretplus.savis.supply.adapter.web;

import java.math.BigDecimal;
import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.supply.domain.Offer;
import com.savouretplus.savis.supply.domain.Provider;

public record SupplyOfferDto(
        UUID id,
        String url,
        String componentName,
        String brand,
        String label,
        String imageUrl,
        PriceDto price,
        PackageSizeDto packageSize,
        ProviderDto provider) {

    public static SupplyOfferDto from(Offer offer) {
        return new SupplyOfferDto(
                offer.publicId(),
                offer.url(),
                offer.componentName(),
                offer.brand(),
                offer.label(),
                offer.imageUrl(),
                PriceDto.from(offer.price()),
                PackageSizeDto.from(offer.packageSize()),
                ProviderDto.from(offer.provider()));
    }

    public record PriceDto(
            BigDecimal amount,
            String currency) {

        static PriceDto from(Money money) {
            if (money == null) {
                return null;
            }

            return new PriceDto(money.amount(), money.currency());
        }
    }

    public record PackageSizeDto(
            double value,
            String unit) {

        static PackageSizeDto from(Quantity quantity) {
            if (quantity == null) {
                return null;
            }

            return new PackageSizeDto(quantity.value(), quantity.unit().getSymbole());
        }
    }

    public record ProviderDto(
            String name,
            String identifier,
            String site) {

        static ProviderDto from(Provider provider) {
            if (provider == null) {
                return null;
            }

            return new ProviderDto(provider.name(), provider.identifier(), provider.site());
        }
    }
}
