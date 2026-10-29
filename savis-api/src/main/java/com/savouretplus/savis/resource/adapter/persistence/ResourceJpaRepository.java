package com.savouretplus.savis.resource.adapter.persistence;

import java.util.Optional;
import java.util.UUID;
import java.util.List;
import java.util.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

interface ResourceJpaRepository extends JpaRepository<ResourceEntity, Long>, JpaSpecificationExecutor<ResourceEntity> {
    List<ResourceEntity> findByPublicIdIn(Collection<UUID> ids);
    Optional<ResourceEntity> findByPublicId(UUID id);
}
