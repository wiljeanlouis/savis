package com.savouretplus.savis.sales.order.usecase;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.savouretplus.savis.sales.order.domain.Order;
import com.savouretplus.savis.sales.order.domain.OrderSource;
import com.savouretplus.savis.sales.order.port.OrderInbox;
import com.savouretplus.savis.sales.order.port.OrderNumberGenerator;
import com.savouretplus.savis.sales.order.port.OrderRepository;
import com.savouretplus.savis.sales.order.port.PendingCustomerOrder;

import lombok.AllArgsConstructor;

/**
 * Manually imports pending customer orders into SAVIS.
 */
@Service
@AllArgsConstructor
public class ImportOrdersUseCase {
    private final OrderInbox inbox;
    private final CustomerOrderImportMapper mapper;
    private final OrderRepository orders;
    private final OrderNumberGenerator orderNumbers;
    private final Clock clock;

    /**
     * Imports every pending order and acknowledges each source row independently.
     */
    public ImportResult execute() {
        if (!inbox.isEnabled()) {
            throw new IllegalStateException("L'import des commandes requiert une inbox configurée");
        }

        List<PendingCustomerOrder> pending = inbox.fetchPending();
        int imported = 0;
        int alreadyImported = 0;
        int failed = 0;
        int acknowledgmentFailed = 0;
        List<ImportFailure> failures = new ArrayList<>();

        for (PendingCustomerOrder source : pending) {
            try {
                if (alreadyExists(source.externalId())) {
                    alreadyImported++;
                    try {
                        inbox.markSynced(source.externalId());
                    } catch (RuntimeException exception) {
                        acknowledgmentFailed++;
                        failures.add(new ImportFailure(source.externalId(), message(exception), true));
                    }
                    continue;
                }

                Order order = mapper.map(
                        source,
                        orderNumbers.next(OrderSource.SAVOURETPLUS_WEB),
                        Instant.now(clock));
                try {
                    orders.save(order);
                    imported++;
                } catch (DataIntegrityViolationException exception) {
                    if (!alreadyExists(source.externalId())) {
                        throw exception;
                    }
                    alreadyImported++;
                }

                try {
                    inbox.markSynced(source.externalId());
                } catch (RuntimeException exception) {
                    acknowledgmentFailed++;
                    failures.add(new ImportFailure(source.externalId(), message(exception), true));
                }
            } catch (RuntimeException exception) {
                failed++;
                String error = message(exception);
                try {
                    inbox.markFailed(source.externalId(), error);
                } catch (RuntimeException acknowledgmentError) {
                    error = error + "; accusé de réception impossible: " + message(acknowledgmentError);
                }
                failures.add(new ImportFailure(source.externalId(), error, false));
            }
        }

        return new ImportResult(
                pending.size(), imported, alreadyImported, failed, acknowledgmentFailed, List.copyOf(failures));
    }

    private boolean alreadyExists(UUID externalOrderId) {
        return orders.existsBySourceAndExternalOrderId(OrderSource.SAVOURETPLUS_WEB, externalOrderId);
    }

    private String message(RuntimeException exception) {
        return exception.getMessage() != null && !exception.getMessage().isBlank()
                ? exception.getMessage()
                : exception.getClass().getSimpleName();
    }

    /**
     * Summarizes the outcome of one manual order import run.
     */
    public record ImportResult(
            int fetchedCount,
            int importedCount,
            int alreadyImportedCount,
            int failedCount,
            int acknowledgmentFailedCount,
            List<ImportFailure> failures) {
    }

    /**
     * Describes one order that could not complete the import or acknowledgment flow.
     */
    public record ImportFailure(UUID externalOrderId, String message, boolean localOrderPersisted) {
    }
}
