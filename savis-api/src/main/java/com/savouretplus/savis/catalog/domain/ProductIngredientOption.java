package com.savouretplus.savis.catalog.domain;

import java.util.UUID;

import com.savouretplus.savis.common.Money;

public record ProductIngredientOption(
        UUID publicId,
        String code,
        String name,
        UUID bomId,
        int defaultQuantity,
        int minQuantity,
        int maxQuantity,
        Money extraPrice,
        boolean active,
        int displayOrder) {

    public ProductIngredientOption {
        publicId = publicId != null ? publicId : UUID.randomUUID();
        requireText(code, "Le code de l'ingrédient est requis");
        requireText(name, "Le nom de l'ingrédient est requis");
        if (minQuantity < 0 || defaultQuantity < minQuantity || maxQuantity < defaultQuantity) {
            throw new IllegalArgumentException(
                    "Les quantités doivent respecter 0 <= minQuantity <= defaultQuantity <= maxQuantity");
        }
        if (extraPrice == null || extraPrice.amount().signum() < 0) {
            throw new IllegalArgumentException("Le prix supplémentaire est requis et ne peut pas être négatif");
        }
        if (displayOrder < 0) {
            throw new IllegalArgumentException("L'ordre d'affichage ne peut pas être négatif");
        }
    }

    public int extraQuantity(int selectedQuantity) {
        validateQuantity(selectedQuantity);
        return Math.max(0, selectedQuantity - defaultQuantity);
    }

    public void validateQuantity(int selectedQuantity) {
        if (selectedQuantity < minQuantity || selectedQuantity > maxQuantity) {
            throw new IllegalArgumentException(
                    "La quantité de %s doit être comprise entre %d et %d"
                            .formatted(name, minQuantity, maxQuantity));
        }
    }

    private static void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }
}
