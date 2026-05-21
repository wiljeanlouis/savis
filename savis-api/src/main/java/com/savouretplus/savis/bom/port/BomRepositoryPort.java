package com.savouretplus.savis.bom.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.bom.domain.Bom;

public interface BomRepositoryPort {

    Optional<Bom> findByPublicId(UUID publicId);

    void save(Bom bom);

    void delete(Bom bom);

    List<Bom> findAll();
}
