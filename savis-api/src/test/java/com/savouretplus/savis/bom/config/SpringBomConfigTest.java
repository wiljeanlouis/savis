package com.savouretplus.savis.bom.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;

class SpringBomConfigTest {

    private final SpringBomConfig config = new SpringBomConfig(
            "savis.offer.requests",
            "savis.offer.requests.exchange");

    @Test
    void declaresDurableOfferRequestQueue() {
        Queue queue = config.offerRequest();

        assertEquals("savis.offer.requests", queue.getName());
        assertTrue(queue.isDurable());
    }

    @Test
    void declaresDurableOfferRequestExchange() {
        DirectExchange exchange = config.offerRequestExchange();

        assertEquals("savis.offer.requests.exchange", exchange.getName());
        assertTrue(exchange.isDurable());
    }

    @Test
    void bindsOfferRequestQueueToExchangeWithQueueNameRoutingKey() {
        Queue queue = config.offerRequest();
        DirectExchange exchange = config.offerRequestExchange();

        Binding binding = config.offerRequestBinding(queue, exchange);

        assertEquals("savis.offer.requests", binding.getDestination());
        assertEquals("savis.offer.requests.exchange", binding.getExchange());
        assertEquals("savis.offer.requests", binding.getRoutingKey());
    }
}
