package com.savouretplus.savis.bom.domain;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import com.savouretplus.savis.common.ActivityType;
import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.bom.port.ComponentPricePort;

public class BomTest {

    @Test
    void testCreate() {
        String title = "Test Bom";
        String description = "This is a test bom.";
        String imageUrl = "http://example.com/image.jpg";
        String instructions = "1. Do this. 2. Do that.";
        Activity prep = new Activity(null, ActivityType.PREP, Minute.of(15), 1);
        Activity cook = new Activity(null, ActivityType.COOK, Minute.of(30), 2);
        Yield yield = new Yield(new Quantity(12, Unit.PORTION), Unit.PORTION);

        Bom bom = new Bom(
                null,
                title,
                description,
                imageUrl,
                instructions,
                BomType.FOOD,
                List.of(),
                List.of(prep, cook),
                yield);

        Assertions.assertNotNull(bom.getPublicId());
        Assertions.assertEquals(bom.getName(), title);
        Assertions.assertEquals(bom.getDescription(), description);
        Assertions.assertEquals(bom.getImageUrl(), imageUrl);
        Assertions.assertEquals(bom.getInstructions(), instructions);
        Assertions.assertEquals(BomType.FOOD, bom.getType());
        Assertions.assertEquals(List.of(prep, cook), bom.activities());
        Assertions.assertEquals(yield, bom.getYield());
        Assertions.assertEquals(Unit.PORTION, bom.getYield().unit());
    }

    @Test
    void testAddComponent() {
        Bom bom = new Bom(
                UUID.randomUUID(),
                "Oeufs brouillés",
                "Oeufs brouillés",
                "Instructions",
                "image.jpg",
                BomType.FOOD,
                List.of(),
                List.of(),
                null);

        bom.addComponent("Flour", 200, Unit.GRAM, null);

        Assertions.assertEquals(1, bom.components().size());
        Assertions.assertEquals("flour", bom.components().get(0).componentName());
        Assertions.assertEquals(200, bom.components().get(0).quantity().value());
        Assertions.assertEquals(Unit.GRAM, bom.components().get(0).quantity().unit());
    }

    @Test
    void testAddComponent_ShouldThrowIllegalStateExceptionWhenAddingDuplicateComponent() {
        Bom bom = new Bom(
                UUID.randomUUID(),
                "Oeufs brouillés",
                "Oeufs brouillés",
                "Instructions",
                "image.jpg",
                BomType.FOOD,
                List.of(),
                List.of(),
                null);
        bom.addComponent("Sugar", 100, Unit.GRAM, null);

        Assertions.assertThrows(IllegalStateException.class, () -> {
            bom.addComponent("Sugar", 50, Unit.GRAM, null);
        });
    }

    @Test
    void testCalculateTotal() {
        Bom bom = new Bom(
                UUID.randomUUID(),
                "Oeufs brouillés",
                "Oeufs brouillés",
                "Instructions",
                "image.jpg",
                BomType.FOOD,
                List.of(),
                List.of(),
                null);
        bom.addComponent("Flour", 200, Unit.GRAM, UUID.fromString("59960a6c-9491-473a-87e9-3244396096d6"));
        bom.addComponent("Sugar", 100, Unit.GRAM, UUID.fromString("59960a6c-9491-473a-87e9-3244396096d1"));

        ComponentPricePort priceCalculator = (name, offerUuid) -> {
            if (offerUuid.toString().equals("59960a6c-9491-473a-87e9-3244396096d6")) {
                return Money.of(5);
            } else if (offerUuid.toString().equals("59960a6c-9491-473a-87e9-3244396096d1")) {
                return Money.of(20);
            }
            return Money.of(0);
        };

        Money total = bom.calculateTotal(priceCalculator);
        Assertions.assertEquals(Money.of(25), total);

    }

}
