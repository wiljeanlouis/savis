package com.savouretplus.savis.supply.adapter.messaging;

import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.supply.usecase.OfferService;

@ExtendWith(MockitoExtension.class)
class OffersListenerTest {

    @Mock
    OfferService offerService;

    @InjectMocks
    OffersListener listener;

    @Test
    void delegatesOffersToOfferService() {
        OffersMessage message = new OffersMessage("task-id", List.of());

        listener.onOffers(message);

        verify(offerService).processOffers(List.of());
    }

    @Test
    void delegatesOfferInvalidationsToOfferService() {
        UUID offerUuid = UUID.randomUUID();
        OfferInvalidationMessage message = new OfferInvalidationMessage(
                offerUuid.toString(),
                "external-id",
                "provider");

        listener.onOfferInvalidation(message);

        verify(offerService).invalidateOffer(offerUuid);
    }
}
