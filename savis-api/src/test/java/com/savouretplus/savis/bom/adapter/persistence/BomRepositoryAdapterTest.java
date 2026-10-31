package com.savouretplus.savis.bom.adapter.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.savouretplus.savis.bom.domain.Bom;
import com.savouretplus.savis.bom.domain.BomComponent;
import com.savouretplus.savis.bom.domain.BomType;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;

class BomRepositoryAdapterTest {
    @Test
    void updatesExistingComponentInPlaceAndPreservesItsRowId() {
        UUID bomId = UUID.randomUUID();
        UUID resourceId = UUID.randomUUID();
        UUID offerId = UUID.randomUUID();
        BomJpaRepository jpa = org.mockito.Mockito.mock(BomJpaRepository.class);
        BomEntity entity = new BomEntity();
        entity.setPublicId(bomId);
        BomComponentEntity existing = new BomComponentEntity();
        existing.setId(73L);
        existing.setResourceId(resourceId);
        existing.setComponentName("Farine");
        existing.setQuantity(100);
        existing.setUnit("g");
        entity.setComponents(new ArrayList<>(List.of(existing)));
        when(jpa.findByPublicId(bomId)).thenReturn(Optional.of(entity));

        BomRepositoryAdapter adapter = new BomRepositoryAdapter(jpa);
        adapter.save(new Bom(bomId, "Pain", "", "", "", BomType.FOOD,
                List.of(new BomComponent(73L, resourceId, "Farine de blé", new Quantity(250, Unit.GRAM), offerId)),
                List.of(), null));

        ArgumentCaptor<BomEntity> saved = ArgumentCaptor.forClass(BomEntity.class);
        verify(jpa).save(saved.capture());
        BomComponentEntity result = saved.getValue().getComponents().getFirst();
        assertSame(existing, result);
        assertEquals(73L, result.getId());
        assertEquals(resourceId, result.getResourceId());
        assertEquals("Farine de blé", result.getComponentName());
        assertEquals(250, result.getQuantity());
        assertEquals(offerId, result.getSelectedOfferId());
    }
}
