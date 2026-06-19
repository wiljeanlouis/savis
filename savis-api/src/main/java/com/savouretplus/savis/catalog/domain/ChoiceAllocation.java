package com.savouretplus.savis.catalog.domain;

/**
 * Represents the selected quantity allocated to a product choice option.
 */
public record ChoiceAllocation(String choiceCode, int quantity) {

    /**
     * Validates a selected choice allocation quantity.
     */
    public ChoiceAllocation {
        if (choiceCode == null || choiceCode.isBlank()) {
            throw new IllegalArgumentException("Le code du choix est requis");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Une allocation doit avoir une quantité supérieure à zéro");
        }
    }
}
