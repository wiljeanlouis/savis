package com.savouretplus.savis.bom.adapter.web;

import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.savouretplus.savis.common.Money;
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

public record BomDto(
        UUID id,
        @NotBlank String name,
        @NotBlank String description,
        @NotBlank String imageUrl,
        String instructions,
        BomType type,
        @JsonAlias("ingredients") @NotNull List<BomComponentDto> components,
        List<ActivityDto> activities,
        @JsonProperty("yield") YieldDto bomYield,
        Integer cookingMinutes,
        Integer preparationMinutes,
        Integer servings) {

    public BomDto {
        components = components != null ? components : List.of();
    }

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
                legacyMinutes(bom, ActivityType.COOK),
                legacyMinutes(bom, ActivityType.PREP),
                legacyServings(bom));
    }

    public Bom toBom() {
        List<BomComponent> bomComponents = components.stream()
                .map(BomComponentDto::toDomain)
                .toList();

        Bom bom = new Bom(
                id,
                null,
                name,
                description,
                imageUrl,
                instructions,
                type,
                bomComponents,
                toActivities(),
                toYield());

        return bom;
    }

    @JsonProperty("ingredients")
    public List<BomComponentDto> ingredients() {
        return components;
    }

    private List<Activity> toActivities() {
        if (activities != null && !activities.isEmpty()) {
            return activities.stream()
                    .map(ActivityDto::toDomain)
                    .toList();
        }

        List<Activity> legacyActivities = new java.util.ArrayList<>();
        if (preparationMinutes != null) {
            legacyActivities.add(new Activity(null, ActivityType.PREP, "Preparation", Minute.of(preparationMinutes), null, 1));
        }
        if (cookingMinutes != null) {
            legacyActivities.add(new Activity(null, ActivityType.COOK, "Cooking", Minute.of(cookingMinutes), null, 2));
        }
        return legacyActivities;
    }

    private Yield toYield() {
        if (bomYield != null) {
            return bomYield.toDomain();
        }
        if (servings != null) {
            return new Yield(new Quantity(servings, Unit.PORTION), Unit.PORTION);
        }
        return null;
    }

    private static Integer legacyMinutes(Bom bom, ActivityType type) {
        return bom.getActivities().stream()
                .filter(activity -> activity.type() == type)
                .map(Activity::minutes)
                .map(Minute::value)
                .reduce(0, Integer::sum);
    }

    private static Integer legacyServings(Bom bom) {
        Yield yield = bom.getYield();
        if (yield == null || yield.unit() != Unit.PORTION) {
            return null;
        }
        return (int) yield.quantity().value();
    }

}

record ActivityDto(
        Long id,
        ActivityType type,
        @NotBlank String name,
        @NotNull Integer minutes,
        Money hourlyRate,
        Integer sequence) {

    public Activity toDomain() {
        return new Activity(id, type, name, Minute.of(minutes), hourlyRate, sequence);
    }

    public static ActivityDto from(Activity activity) {
        return new ActivityDto(
                activity.id(),
                activity.type(),
                activity.name(),
                activity.minutes().value(),
                activity.hourlyRate(),
                activity.sequence());
    }
}

record YieldDto(
        @NotNull double quantity,
        @NotBlank String unit) {

    public Yield toDomain() {
        Unit unitEnum = Unit.valueOf(unit.toUpperCase());
        return new Yield(new Quantity(quantity, unitEnum), unitEnum);
    }

    public static YieldDto from(Yield yield) {
        if (yield == null) {
            return null;
        }
        return new YieldDto(yield.quantity().value(), yield.unit().name());
    }
}

record BomComponentDto(
        @JsonAlias("ingredientName") @NotBlank String componentName,
        @NotNull double quantity,
        @NotBlank String unit,
        UUID selectedOfferId) {

    public Unit unitEnum() {
        return Unit.valueOf(unit.toUpperCase());
    }

    public BomComponent toDomain() {
        return new BomComponent(null, componentName, new Quantity(quantity, unitEnum()), selectedOfferId);
    }

    public static BomComponentDto from(BomComponent componentRequirement) {
        return new BomComponentDto(
                componentRequirement.componentName(),
                componentRequirement.quantity().value(),
                componentRequirement.quantity().unit().name(),
                componentRequirement.selectedOfferId());
    }

    @JsonProperty("ingredientName")
    public String ingredientName() {
        return componentName;
    }

}
