package com.savouretplus.savis.recipe.adapter.external;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.recipe.port.IngredientPricePort;
//import com.savouretplus.savis.supply.api.SupplyApi;

import lombok.AllArgsConstructor;

@Component
@AllArgsConstructor
class IngredientPriceAdapter implements IngredientPricePort {
    // private final SupplyApi supplyApi;

    @Override
    public Money getPrice(String ingredientName, UUID offerId) {
        // return supplyApi.getPriceFor(ingredientName, offerId)
        // .map(dto -> new Money(dto.amount(), dto.currency()))
        // .orElse(Money.ZERO);
        return new Money(new BigDecimal("10.00"), "CAD"); // Valeur fictive pour l'exemple
    }
}
