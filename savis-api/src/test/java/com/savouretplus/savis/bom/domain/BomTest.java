package com.savouretplus.savis.bom.domain;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.bom.port.ComponentPricePort;
import com.savouretplus.savis.bom.port.ComponentPriceRequest;

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

        Money total = bom.calculateTotal(new StubComponentPricePort());
        Assertions.assertEquals(Money.of(25), total);

    }

    @Test
    void testCalculateTotal_ShouldIncludeActivityCosts() {
        Bom bom = new Bom(
                UUID.randomUUID(),
                "Oeufs brouillés",
                "Oeufs brouillés",
                "Instructions",
                "image.jpg",
                BomType.FOOD,
                List.of(),
                List.of(
                        new Activity(null, ActivityType.PREP, Minute.of(30), 1),
                        new Activity(null, ActivityType.COOK, Minute.of(15), 2)),
                null);
        bom.addComponent("Flour", 200, Unit.GRAM, UUID.fromString("59960a6c-9491-473a-87e9-3244396096d6"));

        Map<ComponentPriceRequest, Money> componentPrices = new StubComponentPricePort()
                .getPrices(bom.componentPriceRequests());
        Map<ActivityType, Money> activityRates = Map.of(
                ActivityType.PREP, Money.of(60),
                ActivityType.COOK, Money.of(80));

        Money total = bom.calculateTotal(componentPrices, activityRates);

        Assertions.assertEquals(0, total.amount().compareTo(Money.of(55).amount()));
        Assertions.assertEquals("CAD", total.currency());
    }

    @Test
    void testActivityCalculateCost() {
        Activity activity = new Activity(null, ActivityType.PREP, Minute.of(30), 1);

        Money cost = activity.calculateCost(Money.of(60));

        Assertions.assertEquals(0, cost.amount().compareTo(Money.of(30).amount()));
        Assertions.assertEquals("CAD", cost.currency());
    }

    @Test
    void testActivityRate_ShouldRequireActivityType() {
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            new ActivityRate(null, null, Money.of(60));
        });
    }

    @Test
    void testActivityRate_ShouldRequireHourlyRate() {
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            new ActivityRate(null, ActivityType.PREP, null);
        });
    }

    private static class StubComponentPricePort implements ComponentPricePort {
        @Override
        public Money getPrice(ComponentPriceRequest request) {
            UUID offerUuid = request.selectedOfferId();

            if (offerUuid.toString().equals("59960a6c-9491-473a-87e9-3244396096d6")) {
                return Money.of(5);
            } else if (offerUuid.toString().equals("59960a6c-9491-473a-87e9-3244396096d1")) {
                return Money.of(20);
            }
            return Money.of(0);
        }

        @Override
        public Map<ComponentPriceRequest, Money> getPrices(List<ComponentPriceRequest> requests) {
            Map<ComponentPriceRequest, Money> prices = new LinkedHashMap<>();

            requests.stream().distinct().forEach(request -> prices.put(
                    request,
                    getPrice(request)));

            return prices;
        }
    }

}
