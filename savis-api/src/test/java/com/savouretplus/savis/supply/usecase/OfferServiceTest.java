package com.savouretplus.savis.supply.usecase;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.supply.domain.Offer;
import com.savouretplus.savis.supply.domain.OfferStatus;
import com.savouretplus.savis.supply.domain.Provider;
import com.savouretplus.savis.supply.port.OfferRepository;

@ExtendWith(MockitoExtension.class)
class OfferServiceTest {

    @Mock
    OfferRepository repository;

    @InjectMocks
    OfferService offerService;

    @Test
    void processOffers_ShouldSaveEachOffer() {
        Offer firstOffer = offer(UUID.randomUUID(), "external-1", "provider-a", "Flour", 10);
        Offer secondOffer = offer(UUID.randomUUID(), "external-2", "provider-a", "Sugar", 12);

        offerService.processOffers(List.of(firstOffer, secondOffer));

        verify(repository).save(firstOffer);
        verify(repository).save(secondOffer);
        verifyNoMoreInteractions(repository);
    }

    @Test
    void invalidateOffer_ShouldMarkOfferUnavailable() {
        UUID publicId = UUID.randomUUID();
        Offer offer = offer(publicId, "external-1", "provider-a", "Flour", 10);
        when(repository.findByPublicId(publicId)).thenReturn(Optional.of(offer));

        offerService.invalidateOffer(publicId);

        ArgumentCaptor<Offer> savedOffer = ArgumentCaptor.forClass(Offer.class);
        verify(repository).save(savedOffer.capture());

        Assertions.assertEquals(publicId, savedOffer.getValue().publicId());
        Assertions.assertEquals(OfferStatus.UNAVAILABLE, savedOffer.getValue().status());
    }

    @Test
    void invalidateOffer_ShouldNotSaveWhenOfferDoesNotExist() {
        UUID publicId = UUID.randomUUID();
        when(repository.findByPublicId(publicId)).thenReturn(Optional.empty());

        offerService.invalidateOffer(publicId);

        verify(repository).findByPublicId(publicId);
        verify(repository, never()).save(org.mockito.ArgumentMatchers.any());
        verifyNoMoreInteractions(repository);
    }

    private static Offer offer(UUID publicId, String externalId, String providerIdentifier, String componentName, double price) {
        return new Offer(
                publicId,
                externalId,
                componentName,
                "brand",
                "label",
                Money.of(price),
                new Quantity(1, Unit.KILOGRAM),
                new Provider("Provider", providerIdentifier, "https://example.com", "address"),
                LocalDateTime.now(),
                OfferStatus.AVAILABLE);
    }
}
