package com.savouretplus.savis.bom.adapter.messaging;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import com.savouretplus.savis.bom.domain.BomType;
import com.savouretplus.savis.bom.domain.ComponentNeededEvent;

class RabbitMqPublisherTest {

    private final ApplicationEventPublisher applicationEventPublisher =
            org.mockito.Mockito.mock(ApplicationEventPublisher.class);

    private final RabbitMqPublisher publisher = new RabbitMqPublisher(applicationEventPublisher);

    @Test
    void publishesComponentNeededEventAsApplicationEvent() {
        ComponentNeededEvent event = ComponentNeededEvent.of("flour", BomType.FOOD);

        publisher.publish(event);

        verify(applicationEventPublisher).publishEvent(event);
        verifyNoMoreInteractions(applicationEventPublisher);
    }
}
