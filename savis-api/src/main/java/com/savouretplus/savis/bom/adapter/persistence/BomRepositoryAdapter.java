package com.savouretplus.savis.bom.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import com.savouretplus.savis.bom.domain.Bom;
import com.savouretplus.savis.bom.port.BomRepositoryPort;

import lombok.AllArgsConstructor;

@Repository
@AllArgsConstructor
public class BomRepositoryAdapter implements BomRepositoryPort {

    private static final String BOM_FIND_ERROR = "BOM_FIND_ERROR";
    private static final String BOM_SAVE_ERROR = "BOM_SAVE_ERROR";
    private static final String BOM_DELETE_ERROR = "BOM_DELETE_ERROR";
    private static final String BOM_FIND_ALL_ERROR = "BOM_FIND_ALL_ERROR";

    private final BomJpaRepository jpaRepository;
    private final BomMapper bomMapper;

    @Override
    public Optional<Bom> findByPublicId(UUID publicId) {
        try {
            return jpaRepository.findByPublicId(publicId)
                    .map(bomMapper::toDomain);
        } catch (Exception e) {
            throw new BomPersistenceException(BOM_FIND_ERROR, e.getCause());
        }

    }

    @Override
    public void save(Bom bom) {
        try {
            BomEntity entity = bomMapper.fromDomain(bom);
            jpaRepository.save(entity);
        } catch (Exception e) {
            throw new BomPersistenceException(BOM_SAVE_ERROR, e.getCause());
        }
    }

    @Override
    public void delete(Bom bom) {
        try {
            BomEntity entity = bomMapper.fromDomain(bom);
            jpaRepository.deleteById(entity.getId());
        } catch (Exception e) {
            throw new BomPersistenceException(BOM_DELETE_ERROR, e.getCause());
        }
    }

    @Override
    public List<Bom> findAll() {
        try {
            return jpaRepository.findAll(Sort.by("id").ascending())
                    .stream()
                    .map(bomMapper::toDomain)
                    .toList();
        } catch (Exception e) {
            throw new BomPersistenceException(BOM_FIND_ALL_ERROR, e.getCause());
        }
    }

}
