package com.savouretplus.savis.resource.adapter.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.resource.domain.ResourceCategory;

public record ResourceRequest(
        @NotBlank(message = "Le nom est obligatoire") @Size(max = 160, message = "Le nom ne doit pas dépasser 160 caractères") String name,
        @Size(max = 4000, message = "La description ne doit pas dépasser 4000 caractères") String description,
        @NotNull(message = "La catégorie est obligatoire") ResourceCategory category,
        String referenceUnit) {
    Unit unit() {
        if (referenceUnit == null || referenceUnit.isBlank()) return null;
        try { return Unit.fromSymbole(referenceUnit); }
        catch (IllegalArgumentException error) { throw new IllegalArgumentException("Unité de référence invalide"); }
    }
}
