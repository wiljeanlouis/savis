package com.savouretplus.savis.bom.usecase;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

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
import com.savouretplus.savis.bom.domain.BomType;
import com.savouretplus.savis.bom.domain.Minute;
import com.savouretplus.savis.bom.port.ActivityRateRepositoryPort;
import com.savouretplus.savis.bom.port.BomRepositoryPort;
import com.savouretplus.savis.bom.port.ComponentNeededEventPort;
import com.savouretplus.savis.bom.port.ComponentPricePort;
import com.savouretplus.savis.bom.port.ComponentPriceRequest;
import com.savouretplus.savis.common.Money;
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

        Map<ComponentPriceRequest, Money> componentPrices = new LinkedHashMap<>();
        componentPrices.put(bom.componentPriceRequests().get(0), Money.of(5));
        when(priceCalculator.getPrices(bom.componentPriceRequests())).thenReturn(componentPrices);
        when(activityRateRepository.findAll())
                .thenReturn(List.of(new ActivityRate(1L, ActivityType.PREP, Money.of(60))));

        Money total = bomService.calculateTotalCost(bom);

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

        Money total = bomService.calculateTotalCost(publicId);

        Assertions.assertEquals(Money.ZERO, total);
        verify(repository).findByPublicId(publicId);
        verify(priceCalculator).getPrices(List.of());
        verify(activityRateRepository).findAll();
        verifyNoMoreInteractions(repository, priceCalculator, activityRateRepository, componentNeededEventPublisher);
    }
}
