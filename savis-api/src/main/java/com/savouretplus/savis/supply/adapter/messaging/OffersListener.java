package com.savouretplus.savis.supply.adapter.messaging;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.savouretplus.savis.supply.usecase.OfferService;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Consumes offer result and invalidation messages from RabbitMQ queues.
 */
@Slf4j
@Component
@AllArgsConstructor
public class OffersListener {
    private final OfferService offerService;

    @RabbitListener(
            queues = "${savis.offer.result.queue}",
            containerFactory = "supplyRabbitListenerContainerFactory",
            autoStartup = "${savis.offer.listener.auto-startup:true}")
    /**
     * Handles a batch of offers received from the result queue.
     */
    public void onOffers(OffersMessage message) {
        log.info("onOffers {}", message);
        offerService.processOffers(message.toOffers());
    }

    @RabbitListener(
            queues = "${savis.offer.invalidation.queue}",
            containerFactory = "supplyRabbitListenerContainerFactory",
            autoStartup = "${savis.offer.listener.auto-startup:true}")
    /**
     * Handles a message requesting that an offer be marked unavailable.
     */
    public void onOfferInvalidation(OfferInvalidationMessage message) {
        log.info("onOfferInvalidation {}", message);
        offerService.invalidateOffer(message.toOfferUuid());
    }
}
