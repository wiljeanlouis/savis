package com.savouretplus.savis.bom.adapter.messaging;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.events.EventExternalizationConfiguration;
import org.springframework.modulith.events.RoutingTarget;

import com.savouretplus.savis.bom.domain.BomType;
import com.savouretplus.savis.bom.domain.ComponentNeededEvent;

class ComponentNeededEventExternalizationConfigurationTest {

    private final EventExternalizationConfiguration configuration =
            new ComponentNeededEventExternalizationConfiguration().componentNeededEventExternalization();

    @Test
    void mapsComponentNeededEventToCompatibleRabbitMessage() {
        ComponentNeededEvent event = ComponentNeededEvent.of("flour", BomType.FOOD);

        Object message = configuration.map(event);

        assertTrue(message instanceof ComponentNeededMessage);
        ComponentNeededMessage componentNeededMessage = (ComponentNeededMessage) message;
        assertEquals("flour", componentNeededMessage.content());
        assertEquals("FOOD", componentNeededMessage.type());
    }

    @Test
    void routesComponentNeededEventFromExternalizedAnnotation() {
        ComponentNeededEvent event = ComponentNeededEvent.of("flour", BomType.FOOD);

        RoutingTarget target = configuration.determineTarget(event);

        assertEquals("#{@offerRequestExchange.name}", target.getTarget());
        assertEquals("#{@offerRequest.name}", target.getKey());
    }
}
