package com.savouretplus.savis.bom.port;

import java.util.List;
import java.util.Map;

import com.savouretplus.savis.common.Money;

public interface ComponentPricePort {

    Money getPrice(ComponentPriceRequest request);

    Map<ComponentPriceRequest, Money> getPrices(List<ComponentPriceRequest> requests);

}
