package com.savouretplus.savis.bom.adapter.web;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.savouretplus.savis.bom.domain.*;
import com.savouretplus.savis.bom.usecase.BomService;

class BomControllerCostTest {
    @Test
    void priceListAndDetailExposeTheSameIncompleteValuationWithoutALegacyTotal() throws Exception {
        var service = mock(BomService.class);
        var controller = new BomController(service);
        UUID id = UUID.randomUUID();
        Bom bom = new Bom(id, "Gâteau", "", "", "", BomType.FOOD, List.of(),
                List.of(new Activity(null, ActivityType.COOK, Minute.of(40), 1)), null);
        var cost = bom.calculateCost(Map.of(), Map.of());
        when(service.getBom(id)).thenReturn(bom);
        when(service.calculateTotalCost(id)).thenReturn(cost);
        when(service.calculateTotalCost(bom)).thenReturn(cost);
        when(service.listBoms()).thenReturn(List.of(bom));
        when(service.calculateTotalCosts(List.of(bom))).thenReturn(Map.of(id, cost));

        var price = controller.getBomPrice(id).getBody();
        var detail = controller.getBom(id).getBody();
        var list = controller.listBoms().getBody().iterator().next();
        assertNotNull(price);
        assertNotNull(detail);
        assertFalse(price.complete());
        assertNull(price.totalCost());
        assertNull(detail.price());
        assertNull(list.price());
        assertEquals(price, detail.costing());
        assertEquals(price, list.costing());
        String json = new ObjectMapper().writeValueAsString(detail);
        assertTrue(json.contains("\"totalCost\":null"));
        assertTrue(json.contains("\"knownSubtotal\""));
        assertTrue(json.contains("ACTIVITY_RATE_MISSING"));
        assertTrue(json.contains("MISSING"));
        verify(service).calculateTotalCosts(List.of(bom));
    }
}
