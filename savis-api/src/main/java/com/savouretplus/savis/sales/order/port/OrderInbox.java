package com.savouretplus.savis.sales.order.port;

import java.util.List;
import java.util.UUID;

/**
 * Defines operations for reading and acknowledging an external customer order inbox.
 */
public interface OrderInbox {

    /**
     * Reports whether the inbox integration is enabled.
     */
    boolean isEnabled();

    /**
     * Returns pending customer orders normalized for import.
     */
    List<PendingCustomerOrder> fetchPending();

    /**
     * Marks an external order as successfully synchronized.
     */
    void markSynced(UUID externalOrderId);

    /**
     * Marks an external order as failed with its synchronization error.
     */
    void markFailed(UUID externalOrderId, String error);
}
