package com.savouretplus.savis.sales.workspace.usecase;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.savouretplus.savis.sales.invoice.api.workspace.SalesInvoiceWorkspaceApi;
import com.savouretplus.savis.sales.order.api.workspace.SalesOrderWorkspaceApi;
import com.savouretplus.savis.sales.quotation.api.workspace.SalesQuotationWorkspaceApi;
import lombok.RequiredArgsConstructor;

/** Composes owned sales-document snapshots into read-only commercial dossiers. */
@Service
@RequiredArgsConstructor
public class SalesWorkspaceService {
    private final SalesQuotationWorkspaceApi quotations;
    private final SalesOrderWorkspaceApi orders;
    private final SalesInvoiceWorkspaceApi invoices;

    public SalesWorkspacePage list(int page, int size, String search) {
        return list(page, size, search, WorkspaceFilter.ALL);
    }

    public SalesWorkspacePage list(int page, int size, String search, String filter) {
        return list(page, size, search, WorkspaceFilter.from(filter));
    }

    private SalesWorkspacePage list(int page, int size, String search, WorkspaceFilter filter) {
        if (page < 0 || page > 100_000 || size < 1 || size > 100 || search != null && search.length() > 200) {
            throw new IllegalArgumentException("Pagination ou recherche invalide");
        }
        String needle = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        List<Dossier> dossiers = buildDossiers().stream()
                .filter(dossier -> needle.isEmpty() || dossier.matches(needle))
                .filter(filter::matches)
                .sorted(Comparator.comparing(Dossier::lastActivity,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
        int totalElements = dossiers.size();
        int start = (int) Math.min((long) page * size, totalElements);
        int end = Math.min(start + size, totalElements);
        return new SalesWorkspacePage(
                dossiers.subList(start, end).stream().map(Dossier::summary).toList(),
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
        return buildDossiers().stream()
                .filter(dossier -> dossier.id.equals(dossierId)
                        && dossier.root.type == type
                        && dossier.root.publicId.equals(publicId))
                .findFirst()
                .map(Dossier::details)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dossier introuvable"));
    }

    private List<Dossier> buildDossiers() {
        Map<UUID, Node> requestNodes = new LinkedHashMap<>();
        Map<UUID, Dossier> requestDossiers = new HashMap<>();
        List<Dossier> dossiers = new ArrayList<>();

        for (var request : quotations.requests()) {
            Node node = new Node(
                    DocumentType.REQUEST,
                    request.id(),
                    requestReference(request.id()),
                    request.status(),
                    request.customerName(),
                    null,
                    null,
                    request.lastActivity(),
                    request.status().equals("CLOSED") ? "Consulter la demande" : "Préparer une soumission",
                    "/sales/quote-requests/" + request.id());
            requestNodes.put(request.id(), node);
            Dossier dossier = new Dossier(node);
            dossiers.add(dossier);
            requestDossiers.put(request.id(), dossier);
        }

        Map<UUID, Node> quotationNodes = new LinkedHashMap<>();
        Map<UUID, SalesQuotationWorkspaceApi.Quotation> quotationSnapshots = new HashMap<>();
        Map<UUID, Dossier> dossierByQuotationId = new HashMap<>();
        for (var quotation : quotations.quotations()) {
            Node node = new Node(
                    DocumentType.QUOTATION,
                    quotation.id(),
                    quotation.reference(),
                    quotation.status(),
                    quotation.customerName(),
                    quotation.description(),
                    quotation.amountCents(),
                    quotation.lastActivity(),
                    quotation.orderId(),
                    quotationAction(quotation),
                    "/quotations/" + quotation.id());
            quotationNodes.put(quotation.id(), node);
            quotationSnapshots.put(quotation.id(), quotation);
            Node requestNode = quotation.requestId() == null ? null : requestNodes.get(quotation.requestId());
            if (requestNode == null) {
                if (quotation.requestId() != null) {
                    node.warnings.add("La demande d’origine référencée est introuvable.");
                }
                Dossier dossier = new Dossier(node);
                dossiers.add(dossier);
                dossierByQuotationId.put(quotation.id(), dossier);
            } else {
                requestNode.children.add(node);
                dossierByQuotationId.put(quotation.id(), requestDossiers.get(quotation.requestId()));
            }
        }

        Map<UUID, Node> orderNodes = new LinkedHashMap<>();
        Map<UUID, Dossier> orderDossiers = new HashMap<>();
        List<SalesOrderWorkspaceApi.Order> orderSnapshots = orders.orders();
        Map<UUID, UUID> quotationByOrderId = new HashMap<>();
        quotationSnapshots.values().stream()
                .filter(quotation -> quotation.orderId() != null)
                .forEach(quotation -> quotationByOrderId.put(quotation.orderId(), quotation.id()));
        for (var order : orderSnapshots) {
            Node node = new Node(
                    DocumentType.ORDER,
                    order.id(),
                    order.reference(),
                    order.status(),
                    order.customerName(),
                    order.description(),
                    order.amountCents(),
                    order.lastActivity(),
                    orderAction(order.status()),
                    "/orders/" + order.id());
            orderNodes.put(order.id(), node);

            UUID reverseQuotationId = "QUOTATION".equals(order.source()) ? order.sourceId() : null;
            UUID forwardQuotationId = quotationByOrderId.get(order.id());
            if (reverseQuotationId != null && forwardQuotationId != null
                    && !reverseQuotationId.equals(forwardQuotationId)) {
                node.warnings.add("Les références de la soumission et de la commande sont incohérentes.");
                Dossier dossier = new Dossier(node);
                dossiers.add(dossier);
                orderDossiers.put(order.id(), dossier);
            } else {
                UUID quotationId = reverseQuotationId != null ? reverseQuotationId : forwardQuotationId;
                Node quotationNode = quotationId == null ? null : quotationNodes.get(quotationId);
                if (quotationNode == null) {
                    if (reverseQuotationId != null || forwardQuotationId != null) {
                        node.warnings.add("La soumission d’origine référencée est introuvable.");
                    }
                    Dossier dossier = new Dossier(node);
                    dossiers.add(dossier);
                    orderDossiers.put(order.id(), dossier);
                } else {
                    if (reverseQuotationId == null || forwardQuotationId == null) {
                        node.warnings.add("La relation avec la soumission est partielle.");
                    }
                    quotationNode.action = "Consulter la soumission";
                    quotationNode.children.add(node);
                    Dossier dossier = dossierByQuotationId.get(quotationId);
                    if (dossier == null) {
                        dossier = new Dossier(quotationNode);
                        dossiers.add(dossier);
                        dossierByQuotationId.put(quotationId, dossier);
                    }
                    orderDossiers.put(order.id(), dossier);
                }
            }
        }

        Map<UUID, SalesOrderWorkspaceApi.Order> orderSnapshotsById = orderSnapshots.stream()
                .collect(Collectors.toMap(SalesOrderWorkspaceApi.Order::id, order -> order));
        for (var quotation : quotationSnapshots.values()) {
            if (quotation.orderId() != null && !orderSnapshotsById.containsKey(quotation.orderId())) {
                quotationNodes.get(quotation.id())
                        .warnings.add("La commande issue de cette soumission est introuvable.");
            }
        }

        for (var invoice : invoices.invoices()) {
            Node node = new Node(
                    DocumentType.INVOICE,
                    invoice.id(),
                    invoice.reference(),
                    invoice.status(),
                    invoice.paymentStatus(),
                    invoice.paidAt(),
                    invoice.customerName(),
                    invoice.description(),
                    invoice.amountCents(),
                    invoice.lastActivity(),
                    invoice.orderId(),
                    "Consulter la facture",
                    "/invoices/" + invoice.id());
            if ("PAID".equals(invoice.paymentStatus())) {
                node.children.add(new Node(
                        DocumentType.PAYMENT,
                        invoice.id(),
                        "Paiement",
                        "PAID",
                        "PAID",
                        invoice.paidAt(),
                        "Règlement",
                        null,
                        invoice.amountCents(),
                        invoice.paidAt(),
                        invoice.orderId(),
                        null,
                        null));
            }
            Node orderNode = orderNodes.get(invoice.orderId());
            if (orderNode == null) {
                node.warnings.add("La commande d’origine référencée est introuvable.");
                dossiers.add(new Dossier(node));
                continue;
            }
            orderNode.children.add(node);
            Dossier dossier = orderDossiers.get(invoice.orderId());
            if (dossier == null) {
                dossier = new Dossier(orderNode);
                dossiers.add(dossier);
                orderDossiers.put(invoice.orderId(), dossier);
            }
        }

        return dossiers.stream()
                .collect(Collectors.toMap(
                        dossier -> dossier.id,
                        dossier -> dossier,
                        (first, duplicate) -> first,
                        LinkedHashMap::new))
                .values().stream()
                .toList();
    }

    private String quotationAction(SalesQuotationWorkspaceApi.Quotation quotation) {
        if (quotation.status().equals("DRAFT")) {
            return "Reprendre le brouillon";
        }
        if (quotation.status().equals("ACCEPTED") && quotation.orderId() == null) {
            return "Créer une commande";
        }
        return "Consulter la soumission";
    }

    private String orderAction(String status) {
        return List.of("ACCEPTED", "IN_PREPARATION", "READY", "COMPLETED").contains(status)
                ? "Créer ou voir la facture"
                : "Consulter la commande";
    }

    private String requestReference(UUID id) {
        return "DEM-" + id.toString().substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private enum DocumentType {
        REQUEST,
        QUOTATION,
        ORDER,
        INVOICE,
        PAYMENT
    }

    private static final class Node {
        private final DocumentType type;
        private final UUID publicId;
        private final String reference;
        private final String status;
        private final String paymentStatus;
        private final Instant paidAt;
        private final String customerName;
        private final String description;
        private final Integer amountCents;
        private final Instant lastActivity;
        private final UUID orderId;
        private String action;
        private final String actionUrl;
        private final List<Node> children = new ArrayList<>();
        private final List<String> warnings = new ArrayList<>();

        private Node(
                DocumentType type,
                UUID publicId,
                String reference,
                String status,
                String customerName,
                String description,
                Integer amountCents,
                Instant lastActivity,
                String action,
                String actionUrl) {
            this(type, publicId, reference, status, null, null, customerName, description, amountCents, lastActivity, null, action, actionUrl);
        }

        private Node(
                DocumentType type,
                UUID publicId,
                String reference,
                String status,
                String customerName,
                String description,
                Integer amountCents,
                Instant lastActivity,
                UUID orderId,
                String action,
                String actionUrl) {
            this(type, publicId, reference, status, null, null, customerName, description, amountCents, lastActivity, orderId, action, actionUrl);
        }

        private Node(
                DocumentType type,
                UUID publicId,
                String reference,
                String status,
                String paymentStatus,
                Instant paidAt,
                String customerName,
                String description,
                Integer amountCents,
                Instant lastActivity,
                UUID orderId,
                String action,
                String actionUrl) {
            this.type = type;
            this.publicId = publicId;
            this.reference = reference;
            this.status = status;
            this.paymentStatus = paymentStatus;
            this.paidAt = paidAt;
            this.customerName = customerName;
            this.description = description == null || description.isBlank()
                    ? null
                    : description.strip().substring(0, Math.min(description.strip().length(), 140));
            this.amountCents = amountCents;
            this.lastActivity = lastActivity;
            this.orderId = orderId;
            this.action = action;
            this.actionUrl = actionUrl;
        }

        private SalesWorkspaceBranch toBranch() {
            return new SalesWorkspaceBranch(
                    type.name(),
                    publicId.toString(),
                    reference,
                    status,
                    paymentStatus,
                    paidAt,
                    amountCents,
                    lastActivity,
                    action,
                    actionUrl,
                    warnings,
                    children.stream().sorted(Comparator.comparing(child -> child.lastActivity,
                            Comparator.nullsLast(Comparator.reverseOrder())))
                            .map(Node::toBranch)
                            .toList());
        }

        private void collectMatches(List<String> values) {
            values.add(reference);
            values.add(customerName);
            children.forEach(child -> child.collectMatches(values));
        }

    }

    private static final class Dossier {
        private final Node root;
        private final String id;

        private Dossier(Node root) {
            this.root = root;
            this.id = root.type.name() + ":" + root.publicId;
        }

        private Instant lastActivity() {
            return flatten(root).stream()
                    .map(node -> node.lastActivity)
                    .filter(Objects::nonNull)
                    .max(Comparator.naturalOrder())
                    .orElse(null);
        }

        private boolean matches(String needle) {
            List<String> values = new ArrayList<>();
            root.collectMatches(values);
            return values.stream().filter(Objects::nonNull)
                    .anyMatch(value -> value.toLowerCase(Locale.ROOT).contains(needle));
        }

        private boolean requiresAction() {
            return requiresAction(root);
        }

        private static boolean requiresAction(Node node) {
            if (node.type != DocumentType.PAYMENT) {
                var invoiceNodes = flatten(node).stream()
                        .filter(child -> child.type == DocumentType.INVOICE)
                        .toList();
                if (!invoiceNodes.isEmpty() && invoiceNodes.stream().allMatch(invoice -> "PAID".equals(invoice.paymentStatus))) {
                    return false;
                }
            }
            if (node.children.stream().anyMatch(child -> requiresAction(child))) {
                return true;
            }
            return switch (node.type) {
                case REQUEST -> switch (node.status) {
                    case "RECEIVED", "IN_PROGRESS", "QUOTED" -> true;
                    default -> false;
                };
                case QUOTATION -> switch (node.status) {
                    case "DRAFT", "SENT" -> true;
                    case "ACCEPTED" -> node.orderId == null || node.children.isEmpty();
                    default -> false;
                };
                case ORDER -> switch (node.status) {
                    case "NEW", "ACCEPTED", "IN_PREPARATION", "READY" -> true;
                    default -> false;
                };
                case INVOICE -> switch (node.status) {
                    case "DRAFT" -> true;
                    case "ISSUED" -> !"PAID".equals(node.paymentStatus);
                    default -> false;
                };
                case PAYMENT -> false;
            };
        }

        private SalesWorkspaceSummary summary() {
            return new SalesWorkspaceSummary(
                    id,
                    root.customerName,
                    root.reference,
                    description(root),
                    lastActivity(),
                    situation(root),
                    flatten(root).size() - 1);
        }

        private SalesWorkspaceDossier details() {
            return new SalesWorkspaceDossier(
                    id,
                    root.customerName,
                    root.reference,
                    description(root),
                    lastActivity(),
                    situation(root),
                    root.toBranch());
        }

        private String description(Node node) {
            return node.description;
        }

        private String situation(Node node) {
            List<String> outcomes = node.type == DocumentType.REQUEST && !node.children.isEmpty()
                    ? node.children.stream().map(Dossier::branchSituation).toList()
                    : List.of(branchSituation(node));
            Map<String, Long> counts = outcomes.stream()
                    .collect(Collectors.groupingBy(value -> value, LinkedHashMap::new, Collectors.counting()));
            return counts.entrySet().stream()
                    .map(entry -> entry.getValue() + " " + pluralize(entry.getKey(), entry.getValue()))
                    .collect(Collectors.joining(" · "));
        }

        private static String branchSituation(Node node) {
            if (!node.children.isEmpty()) {
                Node invoice = node.children.stream()
                        .filter(child -> child.type == DocumentType.INVOICE)
                        .findFirst()
                        .orElse(null);
                if (invoice != null) {
                    if ("ISSUED".equals(invoice.status)) {
                        return "PAID".equals(invoice.paymentStatus) ? "branche réglée" : "branche facturée";
                    }
                    return switch (invoice.status) {
                        case "DRAFT" -> "facture brouillon";
                        default -> "facture annulée";
                    };
                }
                return branchSituation(node.children.getFirst());
            }
            return switch (node.type) {
                case REQUEST -> switch (node.status) {
                    case "RECEIVED" -> "demande reçue";
                    case "IN_PROGRESS" -> "demande en préparation";
                    case "QUOTED" -> "demande soumise";
                    default -> "demande clôturée";
                };
                case QUOTATION -> switch (node.status) {
                    case "DRAFT" -> "soumission en brouillon";
                    case "SENT" -> "soumission en attente";
                    case "ACCEPTED" -> "soumission acceptée";
                    default -> "soumission refusée";
                };
                case ORDER -> orderSituation(node.status);
                case INVOICE -> switch (node.status) {
                    case "ISSUED" -> "PAID".equals(node.paymentStatus) ? "branche réglée" : "branche facturée";
                    case "DRAFT" -> "facture brouillon";
                    default -> "facture annulée";
                };
                case PAYMENT -> "paiement confirmé";
            };
        }

        private static String orderSituation(String status) {
            return switch (status) {
                case "NEW" -> "commande à traiter";
                case "ACCEPTED" -> "commande confirmée";
                case "IN_PREPARATION" -> "commande en préparation";
                case "READY" -> "commande prête";
                case "COMPLETED" -> "commande terminée";
                case "CANCELLED" -> "commande annulée";
                default -> "commande refusée";
            };
        }

        private static String pluralize(String outcome, long count) {
            if (count == 1) {
                return outcome;
            }
            return switch (outcome) {
                case "branche facturée" -> "branches facturées";
                case "branche réglée" -> "branches réglées";
                case "paiement confirmé" -> "paiements confirmés";
                case "facture brouillon" -> "factures en brouillon";
                case "demande reçue" -> "demandes reçues";
                case "demande en préparation" -> "demandes en préparation";
                case "demande soumise" -> "demandes soumises";
                case "demande clôturée" -> "demandes clôturées";
                case "soumission en brouillon" -> "soumissions en brouillon";
                case "soumission en attente" -> "soumissions en attente";
                case "soumission acceptée" -> "soumissions acceptées";
                case "soumission refusée" -> "soumissions refusées";
                case "commande à traiter" -> "commandes à traiter";
                case "commande confirmée" -> "commandes confirmées";
                case "commande en préparation" -> "commandes en préparation";
                case "commande prête" -> "commandes prêtes";
                case "commande terminée" -> "commandes terminées";
                case "commande annulée" -> "commandes annulées";
                default -> "commandes refusées";
            };
        }

        private static List<Node> flatten(Node root) {
            List<Node> nodes = new ArrayList<>();
            nodes.add(root);
            root.children.forEach(child -> nodes.addAll(flatten(child)));
            return nodes;
        }
    }

    private enum WorkspaceFilter {
        ALL,
        ACTION_REQUIRED,
        FINISHED;

        private static WorkspaceFilter from(String raw) {
            if (raw == null) {
                return ALL;
            }
            return switch (raw.trim().toUpperCase(Locale.ROOT)) {
                case "", "ALL" -> ALL;
                case "ACTION_REQUIRED", "A_TRAITER" -> ACTION_REQUIRED;
                case "FINISHED", "TERMINES", "TERMINE" -> FINISHED;
                default -> throw new IllegalArgumentException("Filtre invalide");
            };
        }

        private boolean matches(Dossier dossier) {
            return switch (this) {
                case ALL -> true;
                case ACTION_REQUIRED -> dossier.requiresAction();
                case FINISHED -> !dossier.requiresAction();
            };
        }
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
            Integer amountCents,
            Instant lastActivity,
            String action,
            String actionUrl,
            List<String> warnings,
            List<SalesWorkspaceBranch> children) {
    }
}
