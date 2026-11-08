package com.savouretplus.savis.sales.workspace.usecase;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.savouretplus.savis.sales.invoice.api.workspace.SalesInvoiceWorkspaceApi;
import com.savouretplus.savis.sales.order.api.workspace.SalesOrderWorkspaceApi;
import com.savouretplus.savis.sales.quotation.api.workspace.SalesQuotationWorkspaceApi;
import com.savouretplus.savis.sales.workspace.domain.Dossier;
import com.savouretplus.savis.sales.workspace.domain.DocumentType;
import com.savouretplus.savis.sales.workspace.domain.Filter;
import com.savouretplus.savis.sales.workspace.domain.Node;

/**
 * Provides read-only commercial workspace queries over owned sales snapshots.
 */
@Service
public class SalesWorkspaceService {
    private final DossierAssembler assembler;

    @Autowired
    SalesWorkspaceService(DossierAssembler assembler) {
        this.assembler = assembler;
    }

    public SalesWorkspaceService(
            SalesQuotationWorkspaceApi quotations,
            SalesOrderWorkspaceApi orders,
            SalesInvoiceWorkspaceApi invoices) {
        this(new DossierAssembler(quotations, orders, invoices));
    }

    public SalesWorkspacePage list(int page, int size, String search) {
        return list(page, size, search, Filter.ALL);
    }

    /**
     * Reconstructs all dossiers, filters them and sorts by descending last activity
     * (nulls last), then applies in-memory pagination.
     *
     * @param page zero-based page, from 0 to 100000
     * @param size page size, from 1 to 100
     * @param search case-insensitive reference/customer substring, at most 200 characters
     * @param filter attention filter or supported French alias; null means ALL
     * @return page whose totals count filtered dossiers, not documents
     * @throws IllegalArgumentException for invalid pagination, search or filter
     */
    public SalesWorkspacePage list(int page, int size, String search, String filter) {
        return list(page, size, search, Filter.from(filter));
    }

    private SalesWorkspacePage list(int page, int size, String search, Filter filter) {
        if (page < 0 || page > 100_000 || size < 1 || size > 100 || search != null && search.length() > 200) {
            throw new IllegalArgumentException("Pagination ou recherche invalide");
        }
        String needle = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        List<Dossier> dossiers = assembler.assemble().stream()
                .filter(dossier -> needle.isEmpty() || dossier.matches(needle))
                .filter(filter::matches)
                .sorted(Comparator.comparing(
                        Dossier::lastActivity,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
        int totalElements = dossiers.size();
        int start = (int) Math.min((long) page * size, totalElements);
        int end = Math.min(start + size, totalElements);
        return new SalesWorkspacePage(
                dossiers.subList(start, end).stream().map(this::toSummary).toList(),
                page,
                size,
                totalElements,
                totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size));
    }

    /**
     * Rebuilds the current trees and resolves a root identity.
     *
     * @param dossierId exact root type and UUID, for example ORDER: followed by its UUID
     * @return dossier details with document children and relationship warnings
     * @throws ResponseStatusException with HTTP 404 for malformed or absent roots
     */
    public SalesWorkspaceDossier get(String dossierId) {
        String[] parts = dossierId == null ? new String[0] : dossierId.split(":", 2);
        DocumentType type;
        UUID publicId;
        try {
            if (parts.length != 2) {
                throw new IllegalArgumentException();
            }
            type = DocumentType.valueOf(parts[0]);
            publicId = UUID.fromString(parts[1]);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Dossier introuvable");
        }
        return assembler.assemble().stream()
                .filter(dossier -> dossier.id().equals(dossierId))
                .filter(dossier -> dossier.rootType() == type && dossier.rootPublicId().equals(publicId))
                .findFirst()
                .map(this::toDetails)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dossier introuvable"));
    }

    private SalesWorkspaceSummary toSummary(
            Dossier dossier) {
        return new SalesWorkspaceSummary(
                dossier.id(),
                dossier.customerName(),
                dossier.reference(),
                dossier.description(),
                dossier.lastActivity(),
                dossier.situation(),
                dossier.requiresAction(),
                dossier.documentCount());
    }

    private SalesWorkspaceDossier toDetails(
            Dossier dossier) {
        return new SalesWorkspaceDossier(
                dossier.id(),
                dossier.customerName(),
                dossier.reference(),
                dossier.description(),
                dossier.lastActivity(),
                dossier.situation(),
                dossier.requiresAction(),
                toBranch(dossier.root()));
    }

    private SalesWorkspaceBranch toBranch(Node node) {
        return new SalesWorkspaceBranch(
                node.type().name(),
                node.publicId().toString(),
                node.reference(),
                node.status(),
                node.paymentStatus(),
                node.paidAt(),
                node.issuedAt(),
                node.amountCents(),
                node.lastActivity(),
                node.warnings(),
                node.children().stream()
                        .sorted(Comparator.comparing(Node::lastActivity,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                        .map(this::toBranch)
                        .toList());
    }

    /** Page of filtered dossiers; page indexes start at zero and totals exclude filtered-out dossiers. */
    public record SalesWorkspacePage(
            List<SalesWorkspaceSummary> content,
            int page,
            int size,
            long totalElements,
            int totalPages) {
    }

    /** List projection; documentCount counts descendants only, while description belongs to the root. */
    public record SalesWorkspaceSummary(
            String id,
            String customerName,
            String reference,
            String description,
            Instant lastActivity,
            String situation,
            boolean requiresAction,
            int documentCount) {
    }

    /** Detail projection of one current root and its reconstructed document tree. */
    public record SalesWorkspaceDossier(
            String id,
            String customerName,
            String reference,
            String description,
            Instant lastActivity,
            String situation,
            boolean requiresAction,
            SalesWorkspaceBranch root) {
    }

    /** Document projection; nullable payment fields apply to invoices, and warnings diagnose UUID links. */
    public record SalesWorkspaceBranch(
            String type,
            String id,
            String reference,
            String status,
            String paymentStatus,
            Instant paidAt,
            Instant issuedAt,
            Integer amountCents,
            Instant lastActivity,
            List<String> warnings,
            List<SalesWorkspaceBranch> children) {
    }
}
