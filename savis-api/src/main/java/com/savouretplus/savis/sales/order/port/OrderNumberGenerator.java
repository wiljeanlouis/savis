package com.savouretplus.savis.sales.order.port;

import com.savouretplus.savis.sales.order.domain.OrderSource;

/**
 * Generates operator-friendly unique order numbers.
 */
public interface OrderNumberGenerator {

    /**
     * Returns the next order number for the provided source.
     */
    String next(OrderSource source);
}
