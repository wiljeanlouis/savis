package com.savouretplus.savis.resource.port;

import java.util.List;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;
import com.savouretplus.savis.resource.domain.Resource;
import com.savouretplus.savis.resource.domain.ResourceCategory;
import com.savouretplus.savis.resource.domain.ResourceStatus;

public interface ResourceRepository {
    Optional<Resource> findByPublicId(UUID id);
    List<Resource> findByPublicIds(Collection<UUID> ids);
    Resource save(Resource resource);
    ResourcePage search(String search, ResourceCategory category, ResourceStatus status, int page, int size, ResourceSort sort);
}
