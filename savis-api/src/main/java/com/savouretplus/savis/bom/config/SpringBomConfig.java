package com.savouretplus.savis.bom.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Declares Spring beans used by the BOM module.
 */
@Configuration
public class SpringBomConfig {

    private final String queueName;
    private final String exchangeName;

    /**
     * Creates BOM configuration from application properties.
     */
    public SpringBomConfig(
            @Value("${savis.offer.request.queue}") String queueName,
            @Value("${savis.offer.request.exchange}") String exchangeName) {
        this.queueName = queueName;
        this.exchangeName = exchangeName;
    }

    @Bean
    JacksonJsonMessageConverter jacksonJsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    Queue offerRequest() {
        return QueueBuilder.durable(queueName).classic().build();
    }

    @Bean
    DirectExchange offerRequestExchange() {
        return new DirectExchange(exchangeName, true, false);
    }

    @Bean
    Binding offerRequestBinding(Queue offerRequest, DirectExchange offerRequestExchange) {
        return BindingBuilder.bind(offerRequest)
                .to(offerRequestExchange)
                .with(offerRequest.getName());
    }

}
