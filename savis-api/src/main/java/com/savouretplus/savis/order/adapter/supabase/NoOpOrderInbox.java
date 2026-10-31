package com.savouretplus.savis.order.adapter.supabase;

import java.util.List;
import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.savouretplus.savis.order.port.OrderInbox;
import com.savouretplus.savis.order.port.PendingCustomerOrder;

/**
 * Provides a disabled inbox when the Supabase integration is not configured.
 */
@Component
@ConditionalOnProperty(name = "savis.supabase.enabled", havingValue = "false", matchIfMissing = true)
public class NoOpOrderInbox implements OrderInbox {

    /**
     * Reports that the external order inbox is disabled.
     */
    @Override
    public boolean isEnabled() {
        return false;
    }

    /**
     * Returns no pending orders while the integration is disabled.
     */
    @Override
    public List<PendingCustomerOrder> fetchPending() {
        return List.of();
    }

    /**
     * Rejects synchronization acknowledgments while the integration is disabled.
     */
    @Override
    public void markSynced(UUID externalOrderId) {
        throw disabled();
    }

    /**
     * Rejects failure acknowledgments while the integration is disabled.
     */
    @Override
    public void markFailed(UUID externalOrderId, String error) {
        throw disabled();
    }

    private IllegalStateException disabled() {
        return new IllegalStateException("L'import des commandes requiert une inbox configurée");
    }
}
