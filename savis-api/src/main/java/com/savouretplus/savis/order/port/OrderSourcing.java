package com.savouretplus.savis.order.port;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Unit;

/**
 * Defines current supplier-offer lookup operations required by order reports.
 */
public interface OrderSourcing {

    /**
     * Finds the selected supplier offer or the cheapest compatible current offer.
     */
    Optional<SourcingInformation> findCurrent(
            String componentName,
            BigDecimal requiredQuantity,
            Unit unit,
            UUID selectedOfferId);

    /**
     * Represents current sourcing information for a production component.
     */
    record SourcingInformation(
            UUID supplierProductId,
            String productName,
            String imageUrl,
            String brandOrLabel,
            String supplierName,
            BigDecimal packageSize,
            Unit packageUnit,
            Money currentPrice,
            LocalDateTime observedAt) {
    }
}
