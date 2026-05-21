package com.savouretplus.savis.bom.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SpringBomConfig {

    private String queueName;

    public SpringBomConfig(@Value("${savis.offer.request.queue}") String queueName) {
        this.queueName = queueName;
    }

    @Bean
    JacksonJsonMessageConverter jacksonJsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    Queue offerRequest() {
        return QueueBuilder.durable(queueName).classic().build();
    }

}
