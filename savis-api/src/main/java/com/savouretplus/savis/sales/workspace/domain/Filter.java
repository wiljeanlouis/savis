package com.savouretplus.savis.sales.workspace.domain;

import java.util.Locale;

/** Workspace attention filters; FINISHED means the inverse of ACTION_REQUIRED. */
public enum Filter {
    ALL,
    ACTION_REQUIRED,
    FINISHED;

    /**
     * Parses a case-insensitive filter, accepting A_TRAITER, TERMINES and TERMINE.
     *
     * @param raw filter value; null or blank selects ALL
     * @return normalized filter
     * @throws IllegalArgumentException when the value is unsupported
     */
    public static Filter from(String raw) {
        if (raw == null) {
            return ALL;
        }
        return switch (raw.trim().toUpperCase(Locale.ROOT)) {
            case "", "ALL" -> ALL;
            case "ACTION_REQUIRED", "A_TRAITER" -> ACTION_REQUIRED;
            case "FINISHED", "TERMINES", "TERMINE" -> FINISHED;
            default -> throw new IllegalArgumentException("Filtre invalide");
        };
    }

    public boolean matches(Dossier dossier) {
        return switch (this) {
            case ALL -> true;
            case ACTION_REQUIRED -> dossier.requiresAction();
            case FINISHED -> !dossier.requiresAction();
        };
    }
}
