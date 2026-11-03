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

/** Provides read-only commercial workspace queries over owned sales snapshots. */
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
                node.action(),
                node.actionUrl(),
                node.warnings(),
                node.children().stream()
                        .sorted(Comparator.comparing(Node::lastActivity,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                        .map(this::toBranch)
                        .toList());
    }

    public record SalesWorkspacePage(
            List<SalesWorkspaceSummary> content,
            int page,
            int size,
            long totalElements,
            int totalPages) {
    }

    public record SalesWorkspaceSummary(
            String id,
            String customerName,
            String reference,
            String description,
            Instant lastActivity,
            String situation,
            int documentCount) {
    }

    public record SalesWorkspaceDossier(
            String id,
            String customerName,
            String reference,
            String description,
            Instant lastActivity,
            String situation,
            SalesWorkspaceBranch root) {
    }

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
            String action,
            String actionUrl,
            List<String> warnings,
            List<SalesWorkspaceBranch> children) {
    }
}
