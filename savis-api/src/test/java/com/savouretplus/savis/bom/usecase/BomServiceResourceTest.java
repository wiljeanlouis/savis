package com.savouretplus.savis.bom.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;

import com.savouretplus.savis.bom.domain.Bom;
import com.savouretplus.savis.bom.domain.BomComponent;
import com.savouretplus.savis.bom.domain.BomType;
import com.savouretplus.savis.bom.port.ActivityRateRepositoryPort;
import com.savouretplus.savis.bom.port.BomRepositoryPort;
import com.savouretplus.savis.bom.port.ComponentNeededEventPort;
import com.savouretplus.savis.bom.port.ComponentPricePort;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.resource.api.ResourceCatalogApi;
import com.savouretplus.savis.resource.api.ResourceCatalogApi.ResourceReference;

@ExtendWith(MockitoExtension.class)
class BomServiceResourceTest {
    private static final UUID RESOURCE_ID = UUID.randomUUID();
    @Mock BomRepositoryPort repository;
    @Mock ComponentPricePort priceCalculator;
    @Mock ActivityRateRepositoryPort rates;
    @Mock ComponentNeededEventPort events;
    @Mock ResourceCatalogApi resources;
    private BomService service;

    @BeforeEach
    void setUp() {
        service = new BomService(repository, priceCalculator, rates, events, resources);
    }

    @Test
    void savesActiveResourceSnapshotAndPreservesOffer() {
        UUID offerId = UUID.randomUUID();
        when(resources.findReference(RESOURCE_ID)).thenReturn(Optional.of(
                new ResourceReference(RESOURCE_ID, "Farine", "INGREDIENT", "kg", "ACTIVE")));
        Bom submitted = bom(null, RESOURCE_ID, "stale name", Unit.GRAM, offerId);

        service.saveBom(null, submitted);

        ArgumentCaptor<Bom> saved = ArgumentCaptor.forClass(Bom.class);
        verify(repository).save(saved.capture());
        BomComponent component = saved.getValue().components().getFirst();
        assertEquals(RESOURCE_ID, component.resourceId());
        assertEquals("Farine", component.resourceName());
        assertEquals(offerId, component.selectedOfferId());
        assertEquals(200, component.quantity().value());
    }

    @Test
    void rejectsMissingInactiveNewAndIncompatibleResource() {
        when(resources.findReference(RESOURCE_ID)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.saveBom(null,
                bom(null, RESOURCE_ID, "Farine", Unit.GRAM, null)));

        when(resources.findReference(RESOURCE_ID)).thenReturn(Optional.of(
                new ResourceReference(RESOURCE_ID, "Farine", "INGREDIENT", "g", "INACTIVE")));
        assertThrows(IllegalArgumentException.class, () -> service.saveBom(null,
                bom(null, RESOURCE_ID, "Farine", Unit.GRAM, null)));

        when(resources.findReference(RESOURCE_ID)).thenReturn(Optional.of(
                new ResourceReference(RESOURCE_ID, "Farine", "INGREDIENT", "piece", "ACTIVE")));
        assertThrows(IllegalArgumentException.class, () -> service.saveBom(null,
                bom(null, RESOURCE_ID, "Farine", Unit.GRAM, null)));
    }

    @Test
    void allowsUnchangedInactiveHistoricalReference() {
        Long componentId = 42L;
        var historical = new BomComponent(componentId, RESOURCE_ID, "Farine", new Quantity(200, Unit.GRAM), null);
        when(repository.findByPublicId(any())).thenReturn(Optional.of(new Bom(UUID.randomUUID(), "Ancienne", "", "", "", BomType.FOOD,
                List.of(historical), List.of(), null)));
        when(resources.findReference(RESOURCE_ID)).thenReturn(Optional.of(
                new ResourceReference(RESOURCE_ID, "Farine", "INGREDIENT", "kg", "INACTIVE")));

        service.saveBom(UUID.randomUUID(), bom(componentId, RESOURCE_ID, "Farine", Unit.GRAM, null));

        ArgumentCaptor<Bom> saved = ArgumentCaptor.forClass(Bom.class);
        verify(repository).save(saved.capture());
        assertEquals(componentId, saved.getValue().components().getFirst().id());
    }

    private static Bom bom(Long componentId, UUID resourceId, String name, Unit unit, UUID offerId) {
        var component = new BomComponent(componentId, resourceId, name, new Quantity(200, unit), offerId);
        return new Bom(null, "Test", "", "", "", BomType.FOOD, List.of(component), List.of(), null);
    }
}
