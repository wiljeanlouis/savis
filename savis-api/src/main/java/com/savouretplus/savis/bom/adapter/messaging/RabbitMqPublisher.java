package com.savouretplus.savis.bom.adapter.messaging;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import com.savouretplus.savis.bom.domain.ComponentNeededEvent;
import com.savouretplus.savis.bom.port.ComponentNeededEventPort;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class RabbitMqPublisher implements ComponentNeededEventPort {
    private final ApplicationEventPublisher publisher;

    public RabbitMqPublisher(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    @Override
    public void publish(ComponentNeededEvent componentNeededEvent) {
        log.info("Publishing event {}", componentNeededEvent);
        publisher.publishEvent(componentNeededEvent);
    }

}
