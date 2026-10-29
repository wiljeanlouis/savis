package com.savouretplus.savis.resource.usecase;

import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.resource.domain.Resource;
import com.savouretplus.savis.resource.domain.ResourceCategory;
import com.savouretplus.savis.resource.domain.ResourceStatus;
import com.savouretplus.savis.resource.port.ResourcePage;
import com.savouretplus.savis.resource.port.ResourceRepository;

@Service
@Transactional
@AllArgsConstructor
public class ResourceService {
    private final ResourceRepository repository;

    public Resource create(String name, String description, ResourceCategory category, Unit unit) {
        return repository.save(Resource.create(name, description, category, unit));
    }

    public Resource get(UUID id) {
        return repository.findByPublicId(id).orElseThrow(() -> new ResourceNotFoundException(id));
    }

    public Resource update(UUID id, String name, String description, ResourceCategory category, Unit unit) {
        return repository.save(get(id).revise(name, description, category, unit));
    }

    public Resource changeStatus(UUID id, ResourceStatus status) {
        return repository.save(get(id).changeStatus(status));
    }

    public ResourcePage search(String search, ResourceCategory category, ResourceStatus status, int page, int size) {
        if (page < 0 || size < 1 || size > 100)
            throw new IllegalArgumentException("Pagination invalide : page positive ou nulle, taille entre 1 et 100");
        String term = Resource.normalizeName(search).toLowerCase(Locale.ROOT);
        if (term.length() > 160) throw new IllegalArgumentException("La recherche ne doit pas dépasser 160 caractères");
        return repository.search(term, category, status, page, size);
    }
}
