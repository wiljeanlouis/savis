package com.savouretplus.savis.catalog.domain;

public record ChoiceAllocation(String choiceCode, int quantity) {

    public ChoiceAllocation {
        if (choiceCode == null || choiceCode.isBlank()) {
            throw new IllegalArgumentException("Le code du choix est requis");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Une allocation doit avoir une quantité supérieure à zéro");
        }
    }
}
