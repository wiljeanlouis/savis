package com.savouretplus.savis.recipe.domain.port;

import java.util.UUID;

import com.savouretplus.savis.common.Money;


public interface PriceCalculator {

    Money getPrice(UUID offerId);

}
