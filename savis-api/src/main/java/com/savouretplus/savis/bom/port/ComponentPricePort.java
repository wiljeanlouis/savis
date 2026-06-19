package com.savouretplus.savis.bom.port;

import java.util.List;
import java.util.Map;

import com.savouretplus.savis.common.Money;

/**
 * Defines the pricing operations needed to cost BOM components.
 */
public interface ComponentPricePort {

    /**
     * Returns the calculated price for one component price request.
     */
    Money getPrice(ComponentPriceRequest request);

    /**
     * Returns calculated prices for multiple component price requests.
     */
    Map<ComponentPriceRequest, Money> getPrices(List<ComponentPriceRequest> requests);

}
