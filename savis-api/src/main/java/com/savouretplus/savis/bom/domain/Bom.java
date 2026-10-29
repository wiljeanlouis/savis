package com.savouretplus.savis.bom.domain;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.bom.port.ComponentPrice;
import com.savouretplus.savis.bom.port.ComponentPriceRequest;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

/**
 * Represents a bill of materials with components, activities, yield, and costing behavior.
 */
@Getter
@EqualsAndHashCode(of = "publicId")
@ToString
public class Bom {
    private final UUID publicId;

    private final String name;

    private final String description;

    private final String imageUrl;

    private final String instructions;

    private final BomType type;

    private final List<BomComponent> components = new ArrayList<>();

    private final List<Activity> activities = new ArrayList<>();

    private final Yield bomYield;

    /**
     * Creates a BOM aggregate with default identifiers, type, and yield when needed.
     */
    public Bom(UUID publicId,
            String name,
            String description,
            String imageUrl,
            String instructions,
            BomType type,
            List<BomComponent> components,
            List<Activity> activities,
            Yield bomYield) {
        this.publicId = publicId != null ? publicId : UUID.randomUUID();
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.instructions = instructions;
        this.type = type != null ? type : BomType.FOOD;
        if (components != null) {
            this.components.addAll(components);
        }
        if (activities != null) {
            this.activities.addAll(activities);
        }
        this.bomYield = bomYield != null ? bomYield : new Yield(new Quantity(1, Unit.PIECE), Unit.PIECE);
    }

    /**
     * Returns the BOM components as an immutable list view.
     */
    public List<BomComponent> components() {
        return Collections.unmodifiableList(components);
    }

    /**
     * Returns the BOM activities as an immutable list view.
     */
    public List<Activity> activities() {
        return Collections.unmodifiableList(activities);
    }

    /**
     * Returns the yield configured for this BOM.
     */
    public Yield getYield() {
        return bomYield;
    }

    /**
     * Adds a material component to this BOM.
     */
    public void addComponent(String name, double value, Unit unit, UUID selectedOfferId) {
        if (components.stream().anyMatch(i -> i.componentName().equals(name.toLowerCase()))) {
            throw new IllegalStateException("Component already exists in the bom");
        }
        this.components.add(new BomComponent(null, name, new Quantity(value, unit), selectedOfferId));
    }

    /**
     * Adds a production activity to this BOM.
     */
    public void addActivity(Activity activity) {
        this.activities.add(activity);
    }

    /**
     * Builds the component price requests needed to price this BOM.
     */
    public List<ComponentPriceRequest> componentPriceRequests() {
        return components.stream()
                .map(component -> new ComponentPriceRequest(
                        component.componentName(),
                        component.quantity(),
                        component.selectedOfferId()))
                .toList();
    }

    /** Calculates every existing cost line; absent inputs remain explicit. */
    public BomCost calculateCost(Map<ComponentPriceRequest, ComponentPrice> prices,
            Map<ActivityType, Money> rates) {
        List<BomCost.Line> componentLines = componentPriceRequests().stream().map(request -> {
            ComponentPrice price = prices.get(request);
            if (price == null) {
                price = new ComponentPrice(null, null, List.of(new BomCost.Diagnostic(
                        "COMPONENT_PRICE_MISSING", request.componentName(),
                        "Valorisation absente pour " + request.componentName(), true)));
            }
            return new BomCost.Line(request.componentName(),
                    price.amount() == null ? BomCost.Status.MISSING : BomCost.Status.KNOWN,
                    price.amount(), BigDecimal.valueOf(request.quantity().value()),
                    request.quantity().unit().getSymbole(), null, price.source(), price.diagnostics());
        }).toList();
        BigDecimal output = BigDecimal.valueOf(getYield().quantity().value());
        return new BomCost(componentLines,
                activities.stream().map(activity -> activity.costLine(rates.get(activity.type()))).toList(),
                output, output.signum() > 0 ? List.of() : List.of(new BomCost.Diagnostic(
                        "INVALID_YIELD", name, "Le rendement doit être supérieur à zéro", true)));
    }
}
