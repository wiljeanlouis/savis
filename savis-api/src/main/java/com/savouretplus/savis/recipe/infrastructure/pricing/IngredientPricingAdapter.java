package com.savouretplus.savis.recipe.infrastructure.pricing;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.recipe.domain.port.PriceCalculator;
//import com.savouretplus.savis.supply.SupplyApi;

import lombok.AllArgsConstructor;

@Component
@AllArgsConstructor
class IngredientPricingAdapter implements PriceCalculator {
   // private final SupplyApi supplyApi;

    @Override
    public Money getPrice(UUID offerId) {
        // return supplyApi.getPriceFor(ingredientName, providerId)
        // .map(dto -> new Money(dto.amount(), dto.currency()))
        // .orElse(Money.ZERO);
        return new Money(new BigDecimal("10.00"), "CAD"); // Valeur fictive pour l'exemple
    }
}
