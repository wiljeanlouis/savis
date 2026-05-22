package com.savouretplus.savis.supply.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Queue;

class SpringSupplyConfigTest {

    @Test
    void declaresDurableOfferResultsQueue() {
        Queue queue = new SpringSupplyConfig(
                "savis.offer.results",
                "savis.offer.invalidations")
                .offerResults();

        assertEquals("savis.offer.results", queue.getName());
        assertTrue(queue.isDurable());
    }

    @Test
    void declaresDurableOfferInvalidationsQueue() {
        Queue queue = new SpringSupplyConfig(
                "savis.offer.results",
                "savis.offer.invalidations")
                .offerInvalidations();

        assertEquals("savis.offer.invalidations", queue.getName());
        assertTrue(queue.isDurable());
    }
}
