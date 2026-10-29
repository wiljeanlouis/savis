package com.savouretplus.savis.resource.adapter.web;

import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import com.savouretplus.savis.resource.domain.ResourceCategory;
import com.savouretplus.savis.resource.domain.ResourceStatus;
import com.savouretplus.savis.resource.usecase.ResourceService;

@RestController
@RequestMapping("/api/resources")
@AllArgsConstructor
public class ResourceController {
    private final ResourceService service;

    @GetMapping public PageResponse list(@RequestParam(required = false) String search,
            @RequestParam(required = false) ResourceCategory category,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        var result = service.search(search, category, status, page, size);
        return new PageResponse(result.content().stream().map(ResourceResponse::from).toList(), result.totalElements(), result.page(), result.size(), result.totalPages());
    }

    @GetMapping("/batch") public List<ResourceResponse> batch(@RequestParam List<UUID> ids) {
        return service.findByIds(ids).stream().map(ResourceResponse::from).toList();
    }

    @GetMapping("/{id}") public ResourceResponse get(@PathVariable UUID id) { return ResourceResponse.from(service.get(id)); }

    @PostMapping public ResponseEntity<ResourceResponse> create(@Valid @RequestBody ResourceRequest request) {
        var result = service.create(request.name(), request.description(), request.category(), request.unit());
        return ResponseEntity.created(URI.create("/api/resources/" + result.publicId())).body(ResourceResponse.from(result));
    }

    @PutMapping("/{id}") public ResourceResponse update(@PathVariable UUID id, @Valid @RequestBody ResourceRequest request) {
        return ResourceResponse.from(service.update(id, request.name(), request.description(), request.category(), request.unit()));
    }

    @PatchMapping("/{id}/status") public ResourceResponse changeStatus(@PathVariable UUID id, @Valid @RequestBody StatusRequest request) {
        return ResourceResponse.from(service.changeStatus(id, request.status()));
    }

    public record StatusRequest(@NotNull(message = "Le statut est obligatoire") ResourceStatus status) {}
    public record PageResponse(List<ResourceResponse> content, long totalElements, int page, int size, long totalPages) {}
}
