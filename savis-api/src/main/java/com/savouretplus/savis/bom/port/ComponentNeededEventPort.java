package com.savouretplus.savis.bom.port;

import com.savouretplus.savis.bom.domain.ComponentNeededEvent;

/**
 * Defines the outbound port used to publish component pricing requests.
 */
public interface ComponentNeededEventPort {
    /**
     * Publishes catalog products or outbound events through the configured port.
     */
    void publish(ComponentNeededEvent componentNeededEvent);

}
