package com.savouretplus.savis.bom.usecase;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.bom.domain.Activity;
import com.savouretplus.savis.bom.domain.ActivityRate;
import com.savouretplus.savis.bom.domain.ActivityType;
import com.savouretplus.savis.bom.domain.Bom;
import com.savouretplus.savis.bom.port.ComponentPrice;
import com.savouretplus.savis.bom.domain.BomType;
import com.savouretplus.savis.bom.domain.Minute;
import com.savouretplus.savis.bom.domain.Yield;
import com.savouretplus.savis.bom.port.ActivityRateRepositoryPort;
import com.savouretplus.savis.bom.port.BomRepositoryPort;
import com.savouretplus.savis.bom.port.ComponentNeededEventPort;
import com.savouretplus.savis.bom.port.ComponentPricePort;
import com.savouretplus.savis.bom.port.ComponentPriceRequest;
import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;

@ExtendWith(MockitoExtension.class)
class BomServiceTest {

    @Mock
    BomRepositoryPort repository;

    @Mock
    ComponentPricePort priceCalculator;

    @Mock
    ActivityRateRepositoryPort activityRateRepository;

    @Mock
    ComponentNeededEventPort componentNeededEventPublisher;

    @InjectMocks
    BomService bomService;

    @Test
    void calculateTotalCost_ShouldIncludeComponentAndActivityCosts() {
        Bom bom = new Bom(
                UUID.randomUUID(),
                "Cake",
                "Food bom",
                "image.jpg",
                "Bake",
                BomType.FOOD,
                List.of(),
                List.of(new Activity(null, ActivityType.PREP, Minute.of(30), 1)),
                null);
        bom.addComponent("Flour", 200, Unit.GRAM, UUID.fromString("59960a6c-9491-473a-87e9-3244396096d6"));

        Map<ComponentPriceRequest, ComponentPrice> componentPrices = new LinkedHashMap<>();
        componentPrices.put(bom.componentPriceRequests().get(0), new ComponentPrice(Money.of(5), null, List.of()));
        when(priceCalculator.getPrices(bom.componentPriceRequests())).thenReturn(componentPrices);
        when(activityRateRepository.findAll())
                .thenReturn(List.of(new ActivityRate(1L, ActivityType.PREP, Money.of(60))));

        Money total = bomService.calculateTotalCost(bom).totalCost();

        Assertions.assertEquals(0, total.amount().compareTo(Money.of(35).amount()));
        Assertions.assertEquals("CAD", total.currency());
        verify(priceCalculator).getPrices(bom.componentPriceRequests());
        verify(activityRateRepository).findAll();
        verifyNoMoreInteractions(repository, priceCalculator, activityRateRepository, componentNeededEventPublisher);
    }

    @Test
    void calculateTotalCost_ShouldLoadBomById() {
        UUID publicId = UUID.randomUUID();
        Bom bom = new Bom(
                publicId,
                "Cake",
                "Food bom",
                "image.jpg",
                "Bake",
                BomType.FOOD,
                List.of(),
                List.of(),
                null);
        when(repository.findByPublicId(publicId)).thenReturn(Optional.of(bom));
        when(priceCalculator.getPrices(List.of())).thenReturn(Map.of());
        when(activityRateRepository.findAll()).thenReturn(List.of());

        Money total = bomService.calculateTotalCost(publicId).totalCost();

        Assertions.assertEquals(Money.ZERO, total);
        verify(repository).findByPublicId(publicId);
        verify(priceCalculator).getPrices(List.of());
        verify(activityRateRepository).findAll();
        verifyNoMoreInteractions(repository, priceCalculator, activityRateRepository, componentNeededEventPublisher);
    }

    @Test
    void getRequirements_ShouldScaleComponentsFromTheBomYield() {
        UUID publicId = UUID.randomUUID();
        UUID offerId = UUID.randomUUID();
        Bom bom = new Bom(
                publicId,
                "Pâté poulet",
                "",
                "",
                "",
                BomType.FOOD,
                List.of(),
                List.of(),
                new Yield(new Quantity(10, Unit.PIECE), Unit.PIECE));
        bom.addComponent("Farine", 500, Unit.GRAM, offerId);
        when(repository.findByPublicId(publicId)).thenReturn(Optional.of(bom));

        var requirements = bomService.getRequirements(publicId, new BigDecimal("20"));

        Assertions.assertEquals(publicId, requirements.bomId());
        Assertions.assertEquals("Pâté poulet", requirements.bomName());
        Assertions.assertEquals(1, requirements.components().size());
        Assertions.assertEquals("farine", requirements.components().getFirst().componentName());
        Assertions.assertEquals(0,
                requirements.components().getFirst().quantity().compareTo(new BigDecimal("1000")));
        Assertions.assertEquals(Unit.GRAM, requirements.components().getFirst().unit());
        Assertions.assertEquals(offerId, requirements.components().getFirst().selectedOfferId());
    }
    @Test
    void publicPricingRepresentsMissingBomExplicitly() {
        UUID id = UUID.randomUUID();
        when(repository.findByPublicId(id)).thenReturn(Optional.empty());
        var result = bomService.getBomPricing(id);
        Assertions.assertFalse(result.complete());
        Assertions.assertNull(result.totalCost());
        Assertions.assertEquals("BOM_NOT_FOUND", result.diagnostics().getFirst().code());
        verifyNoMoreInteractions(priceCalculator, activityRateRepository);
    }

}
