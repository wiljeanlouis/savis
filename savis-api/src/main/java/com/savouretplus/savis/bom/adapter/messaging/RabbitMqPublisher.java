package com.savouretplus.savis.bom.adapter.messaging;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import com.savouretplus.savis.bom.domain.ComponentNeededEvent;
import com.savouretplus.savis.bom.port.ComponentNeededEventPort;

import lombok.extern.slf4j.Slf4j;

/**
 * Publishes component-needed events through Spring application events for externalization.
 */
@Slf4j
@Service
public class RabbitMqPublisher implements ComponentNeededEventPort {
    private final ApplicationEventPublisher publisher;

    /**
     * Creates the publisher with Spring event dispatching support.
     */
    public RabbitMqPublisher(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    /**
     * Publishes catalog products or outbound events through the configured port.
     */
    @Override
    public void publish(ComponentNeededEvent componentNeededEvent) {
        log.info("Publishing event {}", componentNeededEvent);
        publisher.publishEvent(componentNeededEvent);
    }

}
