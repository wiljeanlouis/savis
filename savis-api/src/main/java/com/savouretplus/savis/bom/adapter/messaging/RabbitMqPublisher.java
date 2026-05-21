package com.savouretplus.savis.bom.adapter.messaging;

import java.io.Serializable;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import com.savouretplus.savis.bom.domain.ComponentNeededEvent;
import com.savouretplus.savis.bom.port.ComponentNeededEventPort;

import lombok.extern.slf4j.Slf4j;

record ComponentNeededMessage(
        String content,
        String type) implements Serializable {
}

@Slf4j
@Service
public class RabbitMqPublisher implements ComponentNeededEventPort {
    private final RabbitTemplate template;
    private final Queue queue;

    public RabbitMqPublisher(
            RabbitTemplate template,
            @Qualifier("offerRequest") Queue queue) {
        this.template = template;
        this.queue = queue;
    }

    @Override
    public void publish(ComponentNeededEvent componentNeededEvent) {
        log.info("Publishing event {}", componentNeededEvent);
        ComponentNeededMessage message = new ComponentNeededMessage(
                componentNeededEvent.componentNameKey(),
                componentNeededEvent.type().name());
        template.convertAndSend(queue.getName(), message);
    }

}
