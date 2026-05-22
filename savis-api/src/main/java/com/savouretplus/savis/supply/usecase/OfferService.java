package com.savouretplus.savis.supply.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.supply.domain.Offer;
import com.savouretplus.savis.supply.port.OfferRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
public class OfferService {

    private final OfferRepository repository;

    public OfferService(OfferRepository repository) {
        this.repository = repository;
    }

    public void processOffers(List<Offer> offers) {
        log.info("Process offers {}", offers);

        offers.forEach(repository::save);
    }

    public List<Offer> searchAvailableOffers(String componentName) {
        log.info("Search available offers for component {}", componentName);
        return repository.searchAvailableByComponentName(componentName);
    }

    public void invalidateOffer(UUID offerUuid) {
        log.info("Invalidate offer {}", offerUuid);
        repository.findByPublicId(offerUuid)
                .map(Offer::unavailable)
                .ifPresent(repository::save);
    }

}
