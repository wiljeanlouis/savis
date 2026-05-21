package com.savouretplus.savis.bom.adapter.external;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.bom.port.ComponentPricePort;
//import com.savouretplus.savis.supply.api.SupplyApi;

import lombok.AllArgsConstructor;

@Component
@AllArgsConstructor
class ComponentPriceAdapter implements ComponentPricePort {
    // private final SupplyApi supplyApi;

    @Override
    public Money getPrice(String componentName, UUID offerId) {
        // return supplyApi.getPriceFor(componentName, offerId)
        // .map(dto -> new Money(dto.amount(), dto.currency()))
        // .orElse(Money.ZERO);
        return new Money(new BigDecimal("10.00"), "CAD"); // Valeur fictive pour l'exemple
    }
}
