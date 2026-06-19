package com.savouretplus.savis.catalog.domain;

import java.util.List;
import java.util.UUID;

/**
 * Represents a group of mutually selectable product choice options.
 * It is used for the farce choice.
 *
 * Ex:
 *  Farce
 *  required = true
 *  options -> thon, hareng saur, poulet
 */
public record ProductChoiceGroup(
        UUID publicId,
        String label,
        boolean required,
        List<ProductChoiceOption> options) {

    /**
     * Validates a product choice group and copies its options.
     */
    public ProductChoiceGroup {
        publicId = publicId != null ? publicId : UUID.randomUUID();
        if (label == null || label.isBlank()) {
            throw new IllegalArgumentException("Le libellé du groupe de choix est requis");
        }
        options = options != null ? List.copyOf(options) : List.of();
        Product.requireUniqueCodes(options.stream().map(ProductChoiceOption::code).toList(), "option de choix");
    }

    /**
     * Returns an active option by code or fails when it is unavailable.
     */
    public ProductChoiceOption activeOption(String code) {
        return options.stream()
                .filter(ProductChoiceOption::active)
                .filter(option -> option.code().equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Option de choix active introuvable: " + code));
    }
}
