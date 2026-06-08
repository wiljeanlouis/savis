package com.savouretplus.savis.catalog.adapter.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.savouretplus.savis.catalog.domain.ProductPricingAnalysis;
import com.savouretplus.savis.catalog.usecase.CatalogPublicationService;
import com.savouretplus.savis.catalog.usecase.ProductPricingService;
import com.savouretplus.savis.catalog.usecase.ProductService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api/catalog/products")
@CrossOrigin(origins = "http://localhost:5173")
@AllArgsConstructor
public class CatalogController {
    private final ProductService products;
    private final ProductPricingService pricing;
    private final CatalogPublicationService publication;

    @GetMapping
    public List<CatalogProductDto> list() {
        return products.list().stream().map(CatalogProductDto::from).toList();
    }

    @GetMapping("/{productId}")
    public CatalogProductDto get(@PathVariable UUID productId) {
        return CatalogProductDto.from(products.get(productId));
    }

    @PostMapping
    public UUID create(@Valid @RequestBody CatalogProductDto request) {
        if (request.id() != null) {
            throw new IllegalArgumentException("Un nouveau produit ne doit pas avoir d'identifiant");
        }
        return products.create(request.toDomain());
    }

    @PutMapping("/{productId}")
    public CatalogProductDto update(
            @PathVariable UUID productId,
            @Valid @RequestBody CatalogProductDto request) {
        if (request.id() != null && !productId.equals(request.id())) {
            throw new IllegalArgumentException("L'identifiant du produit ne correspond pas à la route");
        }
        return CatalogProductDto.from(products.update(productId, request.toDomain(productId)));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> delete(@PathVariable UUID productId) {
        products.delete(productId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{productId}/pricing-analysis")
    public ProductPricingAnalysis analyze(
            @PathVariable UUID productId,
            @RequestBody ProductConfigurationDto configuration) {
        return pricing.analyze(products.get(productId), configuration.toDomain());
    }

    @GetMapping("/{productId}/worst-case-pricing")
    public ProductPricingAnalysis worstCase(
            @PathVariable UUID productId,
            @RequestParam String purchaseModeCode) {
        return pricing.analyzeWorstCase(products.get(productId), purchaseModeCode);
    }

    @PostMapping("/publish")
    public CatalogPublicationService.PublicationResult publish() {
        return publication.publishAll();
    }
}
