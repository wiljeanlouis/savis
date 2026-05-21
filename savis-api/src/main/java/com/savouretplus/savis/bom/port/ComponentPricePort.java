package com.savouretplus.savis.bom.port;

import java.util.UUID;

import com.savouretplus.savis.common.Money;

public interface ComponentPricePort {

    Money getPrice(String componentName, UUID offerId);

}
