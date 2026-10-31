package com.savouretplus.savis.sales.order.adapter.web;

import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.sales.order.usecase.ImportOrdersUseCase.ImportFailure;
import com.savouretplus.savis.sales.order.usecase.ImportOrdersUseCase.ImportResult;

/**
 * Summarizes one manual order inbox retrieval.
 */
public record ImportOrdersResponse(
        int fetchedCount,
        int importedCount,
        int alreadyImportedCount,
        int failedCount,
        int acknowledgmentFailedCount,
        List<FailureResponse> failures) {

    /**
     * Creates the HTTP response from an import result.
     */
    static ImportOrdersResponse from(ImportResult result) {
        return new ImportOrdersResponse(
                result.fetchedCount(), result.importedCount(), result.alreadyImportedCount(), result.failedCount(),
                result.acknowledgmentFailedCount(), result.failures().stream().map(FailureResponse::from).toList());
    }

    /**
     * Describes one import or acknowledgment failure.
     */
    public record FailureResponse(UUID externalOrderId, String message, boolean localOrderPersisted) {

        /**
         * Creates the HTTP failure response from an import failure.
         */
        static FailureResponse from(ImportFailure failure) {
            return new FailureResponse(
                    failure.externalOrderId(), failure.message(), failure.localOrderPersisted());
        }
    }
}
