package com.savouretplus.savis.bom.adapter.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BomJpaRepository extends JpaRepository<BomEntity, Long> {

    Optional<BomEntity> findByPublicId(java.util.UUID publicId);

}
