package com.savouretplus.savis.catalog.domain;

import java.util.UUID;

public record ProductChoiceOption(
        UUID publicId,
        String code,
        String name,
        UUID bomId,
        boolean active,
        int displayOrder) {

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
