package com.savouretplus.savis.order.adapter.web;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.order.usecase.OrderRequirementReport;

/**
 * Represents an order production-requirement report returned over HTTP.
 */
public record OrderRequirementReportResponse(
        UUID orderId,
        String orderNumber,
        Instant generatedAt,
        List<OrderRequirementResponse> requirements,
        boolean complete,
        List<String> warnings) {

    /**
     * Maps an application report to its HTTP representation.
     */
    static OrderRequirementReportResponse from(OrderRequirementReport report) {
        return new OrderRequirementReportResponse(
                report.orderId(),
                report.orderNumber(),
                report.generatedAt(),
                report.requirements().stream().map(OrderRequirementResponse::from).toList(),
                report.complete(),
                report.warnings());
    }

    /**
     * Represents one aggregated component requirement.
     */
    public record OrderRequirementResponse(
            String componentKey,
            String componentName,
            BigDecimal requiredQuantity,
            String unit,
            SourcingInformationResponse sourcingInformation,
            List<OrderRequirementSourceResponse> sources,
            BigDecimal onHandQuantity,
            BigDecimal missingQuantity,
            BigDecimal purchaseQuantity,
            Money estimatedPurchaseCost) {

        private static OrderRequirementResponse from(OrderRequirementReport.OrderRequirement requirement) {
            return new OrderRequirementResponse(
                    requirement.componentKey(),
                    requirement.componentName(),
                    requirement.requiredQuantity(),
                    requirement.unit(),
                    SourcingInformationResponse.from(requirement.sourcingInformation()),
                    requirement.sources().stream().map(OrderRequirementSourceResponse::from).toList(),
                    requirement.onHandQuantity(),
                    requirement.missingQuantity(),
                    requirement.purchaseQuantity(),
                    requirement.estimatedPurchaseCost());
        }
    }

    /**
     * Represents one source contribution in the report.
     */
    public record OrderRequirementSourceResponse(
            UUID bomId,
            String bomName,
            UUID orderItemId,
            String productName,
            String configurationSource,
            BigDecimal quantityContribution,
            String unit) {

        private static OrderRequirementSourceResponse from(
                OrderRequirementReport.OrderRequirementSource source) {
            return new OrderRequirementSourceResponse(
                    source.bomId(),
                    source.bomName(),
                    source.orderItemId(),
                    source.productName(),
                    source.configurationSource(),
                    source.quantityContribution(),
                    source.unit());
        }
    }

    /**
     * Represents current supplier information for a component.
     */
    public record SourcingInformationResponse(
            UUID supplierProductId,
            String productName,
            String imageUrl,
            String brandOrLabel,
            String supplierName,
            BigDecimal packageSize,
            String packageUnit,
            Money currentPrice,
            LocalDateTime observedAt) {

        private static SourcingInformationResponse from(
                OrderRequirementReport.SourcingInformation sourcing) {
            return sourcing == null ? null : new SourcingInformationResponse(
                    sourcing.supplierProductId(),
                    sourcing.productName(),
                    sourcing.imageUrl(),
                    sourcing.brandOrLabel(),
                    sourcing.supplierName(),
                    sourcing.packageSize(),
                    sourcing.packageUnit(),
                    sourcing.currentPrice(),
                    sourcing.observedAt());
        }
    }
}
