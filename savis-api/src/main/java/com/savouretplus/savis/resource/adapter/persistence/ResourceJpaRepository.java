package com.savouretplus.savis.resource.adapter.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

interface ResourceJpaRepository extends JpaRepository<ResourceEntity, Long>, JpaSpecificationExecutor<ResourceEntity> {
    Optional<ResourceEntity> findByPublicId(UUID id);
}
