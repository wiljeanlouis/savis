package com.savouretplus.savis.bom.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.bom.domain.Bom;

/**
 * Defines persistence operations for bills of materials.
 */
public interface BomRepositoryPort {

    /**
     * Finds an aggregate by its public identifier.
     */
    Optional<Bom> findByPublicId(UUID publicId);

    /**
     * Persists the provided aggregate.
     */
    void save(Bom bom);

    /**
     * Deletes the provided aggregate.
     */
    void delete(Bom bom);

    /**
     * Returns all persisted aggregates.
     */
    List<Bom> findAll();
}
