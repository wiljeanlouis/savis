package com.savouretplus.savis.catalog.domain;

import java.util.UUID;

/**
 * Represents a selectable option inside a product choice group.
 *
 * Ex:  thon -> BOM Pâté Thon
 *      hareng saur -> BOM Pâté Hareng Saur
 *      poulet -> BOM Pâté Poulet
 *
 */
public record ProductChoiceOption(
        UUID publicId,
        String code,
        String name,
        UUID bomId,
        boolean active,
        int displayOrder) {

    /**
     * Validates a selectable product choice option.
     */
    public ProductChoiceOption {
        publicId = publicId != null ? publicId : UUID.randomUUID();
        requireText(code, "Le code de l'option est requis");
        requireText(name, "Le nom de l'option est requis");
        if (displayOrder < 0) {
            throw new IllegalArgumentException("L'ordre d'affichage ne peut pas être négatif");
        }
    }

    private static void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }
}
