package com.savouretplus.savis.bom.domain;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.bom.port.ComponentPricePort;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

@Getter
@EqualsAndHashCode(of = "publicId")
@ToString
public class Bom {
    private final UUID publicId;

    private final Long id;

    private final String name;

    private final String description;

    private final String imageUrl;

    private final String instructions;

    private final BomType type;

    private final List<BomComponent> components = new ArrayList<>();

    private final List<Activity> activities = new ArrayList<>();

    private final Yield bomYield;

    public Bom(UUID publicId,
            Long id,
            String name,
            String description,
            String imageUrl,
            String instructions,
            BomType type,
            List<BomComponent> components,
            List<Activity> activities,
            Yield bomYield) {
        this.publicId = publicId != null ? publicId : UUID.randomUUID();
        this.id = id;
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

    public List<BomComponent> components() {
        return Collections.unmodifiableList(components);
    }

    public List<Activity> activities() {
        return Collections.unmodifiableList(activities);
    }

    public Yield getYield() {
        return bomYield;
    }

    public void addComponent(String name, double value, Unit unit, UUID selectedOfferId) {
        if (components.stream().anyMatch(i -> i.componentName().equals(name.toLowerCase()))) {
            throw new IllegalStateException("Component already exists in the bom");
        }
        this.components.add(new BomComponent(null, name, new Quantity(value, unit), selectedOfferId));
    }

    public void addActivity(Activity activity) {
        this.activities.add(activity);
    }

    public Money calculateTotal(ComponentPricePort calculator) {
        return components.stream()
                .map(component -> calculator.getPrice(component.componentName(), component.selectedOfferId()))
                .reduce(Money.ZERO, Money::add);
    }

    public static Bom merge(Bom idProvider, Bom dataProvider) {
        Bom bom = new Bom(
                idProvider.getPublicId(),
                idProvider.getId(),
                dataProvider.name,
                dataProvider.description,
                dataProvider.imageUrl,
                dataProvider.instructions,
                dataProvider.type,
                dataProvider.components,
                dataProvider.activities,
                dataProvider.bomYield);

        return bom;
    }

}
