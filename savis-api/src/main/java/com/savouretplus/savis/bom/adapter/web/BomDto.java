package com.savouretplus.savis.bom.adapter.web;

import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.bom.api.BomPricingApi.BomPricing;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.bom.domain.Activity;
import com.savouretplus.savis.bom.domain.ActivityType;
import com.savouretplus.savis.bom.domain.Bom;
import com.savouretplus.savis.bom.domain.BomComponent;
import com.savouretplus.savis.bom.domain.BomType;
import com.savouretplus.savis.bom.domain.Minute;
import com.savouretplus.savis.bom.domain.Yield;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO used to exchange BOM data over the web API.
 */
public record BomDto(
        UUID id,
        @NotBlank String name,
        @NotBlank String description,
        @NotBlank String imageUrl,
        String instructions,
        BomType type,
        @NotNull List<BomComponentDto> components,
        List<ActivityDto> activities,
        @JsonProperty("yield") YieldDto bomYield,
        Money price,
        BomPricing costing) {

    public BomDto(UUID id, String name, String description, String imageUrl, String instructions,
            BomType type, List<BomComponentDto> components, List<ActivityDto> activities,
            YieldDto bomYield, Money price) {
        this(id, name, description, imageUrl, instructions, type, components, activities, bomYield, price, null);
    }

    /**
     * Normalizes nullable BOM DTO collections.
     */
    public BomDto {
        components = components != null ? components : List.of();
        activities = activities != null ? activities : List.of();
    }

    /**
     * Creates a DTO or API value from the provided domain object.
     */
    public static BomDto from(Bom bom) {
        return new BomDto(
                bom.getPublicId(),
                bom.getName(),
                bom.getDescription(),
                bom.getImageUrl(),
                bom.getInstructions(),
                bom.getType(),
                bom.getComponents().stream()
                        .map(BomComponentDto::from)
                        .toList(),
                bom.getActivities().stream()
                        .map(ActivityDto::from)
                        .toList(),
                YieldDto.from(bom.getYield()),
                null, null);
    }

    /**
     * Creates a DTO or API value from the provided domain object.
     */
    public static BomDto from(Bom bom, BomPricing costing) {
        return new BomDto(
                bom.getPublicId(),
                bom.getName(),
                bom.getDescription(),
                bom.getImageUrl(),
                bom.getInstructions(),
                bom.getType(),
                bom.getComponents().stream()
                        .map(BomComponentDto::from)
                        .toList(),
                bom.getActivities().stream()
                        .map(ActivityDto::from)
                        .toList(),
                YieldDto.from(bom.getYield()),
                costing.totalCost(), costing);
    }

    /**
     * Converts the value to bom.
     */
    public Bom toBom() {
        List<BomComponent> bomComponents = components.stream()
                .map(BomComponentDto::toDomain)
                .toList();

        Bom bom = new Bom(
                id,
                name,
                description,
                imageUrl,
                instructions,
                type,
                bomComponents,
                activities.stream()
                        .map(ActivityDto::toDomain)
                        .toList(),
                bomYield != null ? bomYield.toDomain() : null);

        return bom;
    }

}

/**
 * DTO value used to exchange BOM activity data.
 */
record ActivityDto(
        Long id,
        ActivityType type,
        @NotNull Integer minutes,
        Integer sequence) {

    /**
     * Converts this DTO into its domain representation.
     */
    public Activity toDomain() {
        return new Activity(id, type, Minute.of(minutes), sequence);
    }

    /**
     * Creates a DTO or API value from the provided domain object.
     */
    public static ActivityDto from(Activity activity) {
        return new ActivityDto(
                activity.id(),
                activity.type(),
                activity.minutes().value(),
                activity.sequence());
    }
}

/**
 * DTO value used to exchange BOM yield data.
 */
record YieldDto(
        @NotNull double quantity,
        @NotBlank String unit) {

    /**
     * Converts this DTO into its domain representation.
     */
    public Yield toDomain() {
        Unit unitEnum = Unit.fromSymbole(unit);
        return new Yield(new Quantity(quantity, unitEnum), unitEnum);
    }

    /**
     * Creates a DTO or API value from the provided domain object.
     */
    public static YieldDto from(Yield yield) {
        if (yield == null) {
            return null;
        }
        return new YieldDto(yield.quantity().value(), yield.unit().getSymbole());
    }
}

/**
 * DTO value used to exchange BOM component data.
 */
record BomComponentDto(
        Long id,
        @NotNull UUID resourceId,
        @NotBlank String componentName,
        @NotNull double quantity,
        @NotBlank String unit,
        UUID selectedOfferId) {

    BomComponentDto(String componentName, double quantity, String unit, UUID selectedOfferId) {
        this(null, null, componentName, quantity, unit, selectedOfferId);
    }

    /**
     * Resolves the unit symbol to the domain enum.
     */
    public Unit unitEnum() {
        return Unit.fromSymbole(unit);
    }

    /**
     * Converts this DTO into its domain representation.
     */
    public BomComponent toDomain() {
        return new BomComponent(id, resourceId, componentName, new Quantity(quantity, unitEnum()), selectedOfferId);
    }

    /**
     * Creates a DTO or API value from the provided domain object.
     */
    public static BomComponentDto from(BomComponent componentRequirement) {
        return new BomComponentDto(
                componentRequirement.id(),
                componentRequirement.resourceId(),
                componentRequirement.resourceName(),
                componentRequirement.quantity().value(),
                componentRequirement.quantity().unit().getSymbole(),
                componentRequirement.selectedOfferId());
    }
}
