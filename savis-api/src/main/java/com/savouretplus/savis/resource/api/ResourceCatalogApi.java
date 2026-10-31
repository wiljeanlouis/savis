package com.savouretplus.savis.resource.api;

import java.util.Optional;
import java.util.UUID;

/** Public, persistence-independent view used by modules that reference resources. */
public interface ResourceCatalogApi {
    Optional<ResourceReference> findReference(UUID publicId);

    record ResourceReference(UUID id, String name, String category, String referenceUnit, String status) {}
}
