package com.savouretplus.savis.resource.domain;

import java.text.Normalizer;
import java.util.UUID;
import com.savouretplus.savis.common.Unit;

/** Stable material definition, independent of offers, stock, prices and individual assets. */
public record Resource(UUID publicId, String name, String description,
        ResourceCategory category, Unit referenceUnit, ResourceStatus status) {
    public Resource {
        if (publicId == null) throw new IllegalArgumentException("L'identifiant de la ressource est obligatoire");
        name = normalizeName(name);
        if (name.isEmpty()) throw new IllegalArgumentException("Le nom est obligatoire");
        if (name.length() > 160) throw new IllegalArgumentException("Le nom ne doit pas dépasser 160 caractères");
        description = description == null || description.isBlank() ? null : description.strip();
        if (description != null && description.length() > 4000)
            throw new IllegalArgumentException("La description ne doit pas dépasser 4000 caractères");
        if (category == null) throw new IllegalArgumentException("La catégorie est obligatoire");
        if (referenceUnit == null && category.requiresReferenceUnit())
            throw new IllegalArgumentException("L'unité de référence est obligatoire pour cette catégorie");
        if (referenceUnit == Unit.PORTION)
            throw new IllegalArgumentException("La portion est un rendement, pas une unité de ressource matérielle");
        if (status == null) throw new IllegalArgumentException("Le statut est obligatoire");
    }

    public static Resource create(String name, String description, ResourceCategory category, Unit unit) {
        return new Resource(UUID.randomUUID(), name, description, category, unit, ResourceStatus.ACTIVE);
    }

    public Resource revise(String name, String description, ResourceCategory category, Unit unit) {
        return new Resource(publicId, name, description, category, unit, status);
    }

    /** Idempotent status command: retries preserve the same material identity. */
    public Resource changeStatus(ResourceStatus next) {
        return new Resource(publicId, name, description, category, referenceUnit, next);
    }

    public static String normalizeName(String value) {
        return value == null ? "" : Normalizer.normalize(value, Normalizer.Form.NFKC)
                .replaceAll("(?U)\\s+", " ").strip();
    }
}
