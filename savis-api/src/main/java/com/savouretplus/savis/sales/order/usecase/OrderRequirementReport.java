package com.savouretplus.savis.sales.order.usecase;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.common.Money;

/**
 * Represents the current production-component requirements for an order.
 */
public record OrderRequirementReport(
        UUID orderId,
        String orderNumber,
        Instant generatedAt,
        List<OrderRequirement> requirements,
        boolean complete,
        List<String> warnings) {

    /**
     * Normalizes report collections.
     */
    public OrderRequirementReport {
        requirements = requirements != null ? List.copyOf(requirements) : List.of();
        warnings = warnings != null ? List.copyOf(warnings) : List.of();
    }

    /**
     * Represents one aggregated production component requirement.
     */
    public record OrderRequirement(
            String componentKey,
            String componentName,
            BigDecimal requiredQuantity,
            String unit,
            SourcingInformation sourcingInformation,
            List<OrderRequirementSource> sources,
            BigDecimal onHandQuantity,
            BigDecimal missingQuantity,
            BigDecimal purchaseQuantity,
            Money estimatedPurchaseCost) {

        /**
         * Normalizes requirement source collections.
         */
        public OrderRequirement {
            sources = sources != null ? List.copyOf(sources) : List.of();
        }
    }

    /**
     * Explains one BOM and order-item contribution to an aggregated requirement.
     */
    public record OrderRequirementSource(
            UUID bomId,
            String bomName,
            UUID orderItemId,
            String productName,
            String configurationSource,
            BigDecimal quantityContribution,
            String unit) {
    }

    /**
     * Represents the current supplier product known for a component.
     */
    public record SourcingInformation(
            UUID supplierProductId,
            String productName,
            String imageUrl,
            String brandOrLabel,
            String supplierName,
            BigDecimal packageSize,
            String packageUnit,
            Money currentPrice,
            LocalDateTime observedAt) {
    }
}
