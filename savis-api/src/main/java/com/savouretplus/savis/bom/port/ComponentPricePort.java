package com.savouretplus.savis.bom.port;

import java.util.List;
import java.util.Map;

/**
 * Resolves expected valuation failures explicitly. Unexpected technical failures propagate to the caller.
 */
public interface ComponentPricePort {

    /**
     * Returns the calculated price for one component price request.
     */
    ComponentPrice getPrice(ComponentPriceRequest request);

    /**
     * Returns calculated prices for multiple component price requests.
     */
    Map<ComponentPriceRequest, ComponentPrice> getPrices(List<ComponentPriceRequest> requests);

}
