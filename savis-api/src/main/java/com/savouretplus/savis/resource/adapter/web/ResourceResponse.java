package com.savouretplus.savis.resource.adapter.web;

import java.util.UUID;
import com.savouretplus.savis.resource.domain.Resource;
import com.savouretplus.savis.resource.domain.ResourceCategory;
import com.savouretplus.savis.resource.domain.ResourceStatus;

public record ResourceResponse(UUID id, String name, String description, ResourceCategory category,
        String referenceUnit, ResourceStatus status) {
    static ResourceResponse from(Resource resource) {
        return new ResourceResponse(resource.publicId(), resource.name(), resource.description(), resource.category(),
                resource.referenceUnit() == null ? null : resource.referenceUnit().getSymbole(), resource.status());
    }
}
