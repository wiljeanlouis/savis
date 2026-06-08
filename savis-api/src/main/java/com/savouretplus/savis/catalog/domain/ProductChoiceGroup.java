package com.savouretplus.savis.catalog.domain;

import java.util.List;
import java.util.UUID;

public record ProductChoiceGroup(
        UUID publicId,
        String label,
        boolean required,
        List<ProductChoiceOption> options) {

    public ProductChoiceGroup {
        publicId = publicId != null ? publicId : UUID.randomUUID();
        if (label == null || label.isBlank()) {
            throw new IllegalArgumentException("Le libellé du groupe de choix est requis");
        }
        options = options != null ? List.copyOf(options) : List.of();
        Product.requireUniqueCodes(options.stream().map(ProductChoiceOption::code).toList(), "option de choix");
    }

    public ProductChoiceOption activeOption(String code) {
        return options.stream()
                .filter(ProductChoiceOption::active)
                .filter(option -> option.code().equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Option de choix active introuvable: " + code));
    }
}
