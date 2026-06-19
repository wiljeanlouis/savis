package com.savouretplus.savis.supply.adapter.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.savouretplus.savis.supply.usecase.OfferService;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller exposing supplier offer search endpoints.
 */
@Slf4j
@RestController
@RequestMapping({ "/api/supply/offers" })
@CrossOrigin(origins = "http://localhost:5173")
@AllArgsConstructor
public class SupplyOfferController {

    private final OfferService offerService;

    /**
     * Searches supplier offers for a component name.
     */
    @GetMapping
    public ResponseEntity<List<SupplyOfferDto>> searchOffers(
            @RequestParam String componentName) {
        log.info("Received request to search available offers for component: {}", componentName);

        List<SupplyOfferDto> offers = offerService.searchAvailableOffers(componentName)
                .stream()
                .map(SupplyOfferDto::from)
                .toList();

        return ResponseEntity.ok(offers);
    }
}
