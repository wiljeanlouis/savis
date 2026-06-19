package com.savouretplus.savis.supply.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Declares queue and listener beans used by the supply module.
 */
@Configuration
public class SpringSupplyConfig {
    private final String resultQueueName;
    private final String invalidationQueueName;

    /**
     * Creates supply queue configuration from application properties.
     */
    public SpringSupplyConfig(
            @Value("${savis.offer.result.queue}") String resultQueueName,
            @Value("${savis.offer.invalidation.queue}") String invalidationQueueName) {
        this.resultQueueName = resultQueueName;
        this.invalidationQueueName = invalidationQueueName;
    }

    @Bean
    Queue offerResults() {
        return QueueBuilder.durable(resultQueueName).classic().build();
    }

    @Bean
    Queue offerInvalidations() {
        return QueueBuilder.durable(invalidationQueueName).classic().build();
    }

    @Bean
    SimpleRabbitListenerContainerFactory supplyRabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            JacksonJsonMessageConverter jacksonJsonMessageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jacksonJsonMessageConverter);
        factory.setDefaultRequeueRejected(false);
        return factory;
    }

}
