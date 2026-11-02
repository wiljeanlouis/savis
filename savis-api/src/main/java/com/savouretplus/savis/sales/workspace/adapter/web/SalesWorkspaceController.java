package com.savouretplus.savis.sales.workspace.adapter.web;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.savouretplus.savis.sales.workspace.usecase.SalesWorkspaceService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SalesWorkspaceController {
    private final SalesWorkspaceService workspace;

    @GetMapping("/workspace")
    public ResponseEntity<SalesWorkspaceService.SalesWorkspacePage> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "ALL") String filter) {
        if (page < 0 || page > 100_000 || size < 1 || size > 100 || search.length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pagination ou recherche invalide");
        }
        try {
            return ResponseEntity.ok()
                    .cacheControl(CacheControl.noStore())
                    .body(workspace.list(page, size, search, filter));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    @GetMapping("/workspace/{dossierId}")
    public ResponseEntity<SalesWorkspaceService.SalesWorkspaceDossier> get(@PathVariable String dossierId) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(workspace.get(dossierId));
    }
}
