package com.savouretplus.savis.catalog.domain;

import java.util.UUID;

/** Explains an expected costing gap or a non-blocking source warning. */
public record CostDiagnostic(UUID bomId, String code, String source, String message, boolean blocking) {}
