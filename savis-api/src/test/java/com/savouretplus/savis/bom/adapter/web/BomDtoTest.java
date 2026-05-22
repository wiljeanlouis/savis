package com.savouretplus.savis.bom.adapter.web;

import java.util.List;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import com.savouretplus.savis.bom.domain.Bom;
import com.savouretplus.savis.bom.domain.BomType;
import com.savouretplus.savis.common.ActivityType;
import com.savouretplus.savis.common.Unit;

public class BomDtoTest {

    @Test
    void toBom_ShouldUseActivitiesAndYield() {
        BomDto dto = new BomDto(
                null,
                "Balloon arch",
                "Decoration bom",
                "image.jpg",
                "Assemble and install",
                BomType.DECORATION,
                List.of(new BomComponentDto("Balloon", 120, "PIECE", null)),
                List.of(new ActivityDto(null, ActivityType.ASSEMBLY, 90, 1)),
                new YieldDto(1, "PIECE"));

        Bom bom = dto.toBom();

        Assertions.assertEquals(BomType.DECORATION, bom.getType());
        Assertions.assertEquals(1, bom.components().size());
        Assertions.assertEquals("balloon", bom.components().get(0).componentName());
        Assertions.assertEquals(1, bom.activities().size());
        Assertions.assertEquals(ActivityType.ASSEMBLY, bom.activities().get(0).type());
        Assertions.assertEquals(90, bom.activities().get(0).minutes().value());
        Assertions.assertEquals(Unit.PIECE, bom.getYield().unit());
    }

    @Test
    void toBom_ShouldUseMultipleActivitiesAndPortionYield() {
        BomDto dto = new BomDto(
                null,
                "Cake",
                "Food bom",
                "image.jpg",
                "Bake",
                BomType.FOOD,
                List.of(),
                List.of(
                        new ActivityDto(null, ActivityType.PREP, 15, 1),
                        new ActivityDto(null, ActivityType.COOK, 30, 2)),
                new YieldDto(12, "PORTION"));

        Bom bom = dto.toBom();

        Assertions.assertEquals(2, bom.activities().size());
        Assertions.assertEquals(ActivityType.PREP, bom.activities().get(0).type());
        Assertions.assertEquals(15, bom.activities().get(0).minutes().value());
        Assertions.assertEquals(ActivityType.COOK, bom.activities().get(1).type());
        Assertions.assertEquals(30, bom.activities().get(1).minutes().value());
        Assertions.assertEquals(12, bom.getYield().quantity().value());
        Assertions.assertEquals(Unit.PORTION, bom.getYield().unit());
    }

    @Test
    void from_ShouldExposeUnitCodes() {
        Bom bom = new Bom(
                null,
                null,
                "Cake",
                "Food bom",
                "image.jpg",
                "Bake",
                BomType.FOOD,
                List.of(),
                List.of(),
                new com.savouretplus.savis.bom.domain.Yield(
                        new com.savouretplus.savis.common.Quantity(12, Unit.PORTION),
                        Unit.PORTION));
        bom.addComponent("Flour", 200, Unit.GRAM, null);

        BomDto dto = BomDto.from(bom);

        Assertions.assertEquals("portion", dto.bomYield().unit());
        Assertions.assertEquals("g", dto.components().get(0).unit());
    }
}
