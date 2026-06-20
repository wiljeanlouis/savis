package com.savouretplus.savis.bom.adapter.web;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.savouretplus.savis.bom.usecase.BomService;
import com.savouretplus.savis.common.Money;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller exposing BOM management and pricing endpoints.
 */
@Slf4j
@RestController
@RequestMapping({ "/api/boms" })
@AllArgsConstructor
public class BomController {

    private final BomService bomService;

    /**
     * Creates or replaces a BOM using the supplied identifier.
     */
    @PostMapping()
    public ResponseEntity<UUID> saveBom(@Valid @RequestBody BomDto request) {
        log.info("Received request to save bomDto: {}", request);

        UUID bomId = bomService.saveBom(request.id(), request.toBom());

        return ResponseEntity.ok(bomId);
    }

    /**
     * Returns a BOM by identifier.
     */
    @GetMapping("/{bomId}")
    public ResponseEntity<BomDto> getBom(@PathVariable UUID bomId) {
        log.info("Received request to get bom: {}", bomId);

        BomDto response = BomDto.from(bomService.getBom(bomId));

        return ResponseEntity.ok(response);
    }

    /**
     * Returns the bom price.
     */
    @GetMapping("/{bomId}/price")
    public ResponseEntity<Money> getBomPrice(@PathVariable UUID bomId) {
        log.info("Received request to get bom price: {}", bomId);

        return ResponseEntity.ok(bomService.calculateTotalCost(bomId));
    }

    /**
     * Deletes a BOM by identifier.
     */
    @DeleteMapping("/{bomId}")
    public ResponseEntity<Void> deleteBom(@PathVariable UUID bomId) {
        log.info("Received request to delete bom: {}", bomId);
        bomService.deleteBom(bomId);

        return ResponseEntity.noContent().build();
    }

    /**
     * Lists all BOMs.
     */
    @GetMapping()
    public ResponseEntity<Iterable<BomDto>> listBoms() {
        log.info("Received request to list boms");

        var boms = bomService.listBoms();
        Map<UUID, Money> pricesByBomId = bomService.calculateTotalCosts(boms);

        List<BomDto> responses = boms
                .stream()
                .map(bom -> BomDto.from(bom, pricesByBomId.getOrDefault(bom.getPublicId(), Money.ZERO)))
                .toList();

        return ResponseEntity.ok(responses);
    }

}
