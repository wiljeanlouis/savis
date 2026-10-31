package com.savouretplus.savis.bom.adapter.web;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.savouretplus.savis.bom.domain.*;
import com.savouretplus.savis.bom.port.*;
import com.savouretplus.savis.common.Unit;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.savouretplus.savis.bom.usecase.BomService;

class BomControllerCostTest {
    @Test
    void priceAndDetailExposeTheSameIncompleteValuationWithoutALegacyTotal() throws Exception {
        var service = mock(BomService.class);
        var controller = new BomController(service);
        UUID id = UUID.randomUUID();
        Bom bom = new Bom(id, "Gâteau", "", "", "", BomType.FOOD, List.of(),
                List.of(new Activity(null, ActivityType.COOK, Minute.of(40), 1)), null);
        var cost = bom.calculateCost(Map.of(), Map.of());
        when(service.getBom(id)).thenReturn(bom);
        when(service.calculateTotalCost(id)).thenReturn(cost);
        when(service.calculateTotalCost(bom)).thenReturn(cost);

        var price = controller.getBomPrice(id).getBody();
        var detail = controller.getBom(id).getBody();
        assertNotNull(price);
        assertNotNull(detail);
        assertFalse(price.complete());
        assertNull(price.totalCost());
        assertNull(detail.price());
        assertEquals(price, detail.costing());
        String json = new ObjectMapper().writeValueAsString(detail);
        assertTrue(json.contains("\"totalCost\":null"));
        assertTrue(json.contains("\"knownSubtotal\""));
        assertTrue(json.contains("ACTIVITY_RATE_MISSING"));
        assertTrue(json.contains("MISSING"));
    }
    @Test
    void listReturnsUnpricedBomsWithoutReadingSupplierPricesOrActivityRates() throws Exception {
        var repository = mock(BomRepositoryPort.class);
        var prices = mock(ComponentPricePort.class);
        var rates = mock(ActivityRateRepositoryPort.class);
        var service = new BomService(repository, prices, rates);
        UUID id = UUID.randomUUID();
        var bom = new Bom(id, "Gâteau", "Description", "image.jpg", "Mélanger", BomType.FOOD,
                List.of(), List.of(new Activity(null, ActivityType.COOK, Minute.of(40), 1)), null);
        bom.addComponent("Farine", 100, Unit.GRAM, null);
        when(repository.findAll()).thenReturn(List.of(bom));
        var mvc = MockMvcBuilders.standaloneSetup(new BomController(service)).build();

        mvc.perform(get("/api/boms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id.toString()))
                .andExpect(jsonPath("$[0].name").value("Gâteau"))
                .andExpect(jsonPath("$[0].description").value("Description"))
                .andExpect(jsonPath("$[0].imageUrl").value("image.jpg"))
                .andExpect(jsonPath("$[0].yield.quantity").value(1))
                .andExpect(jsonPath("$[0].components[0].componentName").value("Farine"))
                .andExpect(jsonPath("$[0].activities[0].type").value("COOK"))
                .andExpect(jsonPath("$[0].price").value(nullValue()))
                .andExpect(jsonPath("$[0].costing").value(nullValue()));

        verify(repository).findAll();
        verifyNoMoreInteractions(repository);
        verifyNoInteractions(prices, rates);
    }

}
