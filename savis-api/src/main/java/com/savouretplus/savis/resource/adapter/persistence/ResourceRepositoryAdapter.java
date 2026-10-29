package com.savouretplus.savis.resource.adapter.persistence;

import java.util.ArrayList;
import jakarta.persistence.criteria.Predicate;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
import java.util.Collection;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;
import lombok.AllArgsConstructor;
import com.savouretplus.savis.resource.domain.Resource;
import com.savouretplus.savis.resource.domain.ResourceCategory;
import com.savouretplus.savis.resource.domain.ResourceStatus;
import com.savouretplus.savis.resource.port.ResourcePage;
import com.savouretplus.savis.resource.port.ResourceRepository;

@Repository
@AllArgsConstructor
public class ResourceRepositoryAdapter implements ResourceRepository {
    private final ResourceJpaRepository repository;

    @Override public Optional<Resource> findByPublicId(UUID id) {
        return repository.findByPublicId(id).map(this::toDomain);
    }

    @Override public List<Resource> findByPublicIds(Collection<UUID> ids) {
        return repository.findByPublicIdIn(ids).stream().map(this::toDomain).toList();
    }

    @Override public Resource save(Resource resource) {
        var entity = repository.findByPublicId(resource.publicId()).orElseGet(ResourceEntity::new);
        entity.setPublicId(resource.publicId());
        entity.setName(resource.name());
        entity.setDescription(resource.description());
        entity.setCategory(resource.category());
        entity.setReferenceUnit(resource.referenceUnit());
        entity.setStatus(resource.status());
        return toDomain(repository.save(entity));
    }

    @Override public ResourcePage search(String term, ResourceCategory category, ResourceStatus status, int page, int size) {
        Specification<ResourceEntity> specification = (root, query, builder) -> {
            var predicates = new ArrayList<Predicate>();
            if (!term.isEmpty()) {
                // User search is literal: SQL wildcard characters must not broaden matches.
                String pattern = "%" + term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                predicates.add(builder.or(builder.like(builder.lower(root.get("name")), pattern, '\\'),
                        builder.like(builder.lower(root.get("description")), pattern, '\\')));
            }
            if (category != null) predicates.add(builder.equal(root.get("category"), category));
            if (status != null) predicates.add(builder.equal(root.get("status"), status));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
        var result = repository.findAll(specification, PageRequest.of(page, size, Sort.by("name", "publicId")));
        return new ResourcePage(result.getContent().stream().map(this::toDomain).toList(), result.getTotalElements(), page, size);
    }

    private Resource toDomain(ResourceEntity entity) {
        return new Resource(entity.getPublicId(), entity.getName(), entity.getDescription(), entity.getCategory(), entity.getReferenceUnit(), entity.getStatus());
    }
}
