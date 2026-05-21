package com.savouretplus.savis.bom.adapter.web;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.savouretplus.savis.bom.usecase.BomService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping({ "/api/boms", "/api/recipes" })
@CrossOrigin(origins = "http://localhost:5173") // Allow only your frontend origin
@AllArgsConstructor
public class BomController {

    private final BomService bomService;

    @PostMapping()
    public ResponseEntity<UUID> saveBom(@Valid @RequestBody BomDto request) {
        log.info("Received request to save bomDto: {}", request);

        UUID bomId = bomService.saveBom(request.id(), request.toBom());

        return ResponseEntity.ok(bomId);
    }

    @GetMapping("/{bomId}")
    public ResponseEntity<BomDto> getBom(@PathVariable UUID bomId) {
        log.info("Received request to get bom: {}", bomId);

        BomDto response = BomDto.from(bomService.getBom(bomId));

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{bomId}")
    public ResponseEntity<Void> deleteBom(@PathVariable UUID bomId) {
        log.info("Received request to delete bom: {}", bomId);
        bomService.deleteBom(bomId);

        return ResponseEntity.noContent().build();
    }

    @GetMapping()
    public ResponseEntity<Iterable<BomDto>> listBoms() {
        log.info("Received request to list boms");

        Iterable<BomDto> responses = bomService.listBoms()
                .stream()
                .map(BomDto::from)
                .toList();

        return ResponseEntity.ok(responses);
    }

}
