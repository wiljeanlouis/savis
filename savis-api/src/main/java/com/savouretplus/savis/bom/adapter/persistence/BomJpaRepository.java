package com.savouretplus.savis.bom.adapter.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data repository for BOM entities.
 */
public interface BomJpaRepository extends JpaRepository<BomEntity, Long> {

    /**
     * Finds an aggregate by its public identifier.
     */
    Optional<BomEntity> findByPublicId(java.util.UUID publicId);

}
