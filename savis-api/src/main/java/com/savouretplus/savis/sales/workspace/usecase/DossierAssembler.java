package com.savouretplus.savis.sales.workspace.usecase;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.sales.invoice.api.workspace.SalesInvoiceWorkspaceApi;
import com.savouretplus.savis.sales.order.api.workspace.SalesOrderWorkspaceApi;
import com.savouretplus.savis.sales.quotation.api.workspace.SalesQuotationWorkspaceApi;
import com.savouretplus.savis.sales.workspace.domain.Dossier;
import com.savouretplus.savis.sales.workspace.domain.DocumentType;
import com.savouretplus.savis.sales.workspace.domain.Node;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
class DossierAssembler {
    private final SalesQuotationWorkspaceApi quotations;
    private final SalesOrderWorkspaceApi orders;
    private final SalesInvoiceWorkspaceApi invoices;

    List<Dossier> assemble() {
        Map<UUID, Node> requestNodes = new LinkedHashMap<>();
        Map<UUID, Dossier> requestDossiers = new HashMap<>();
        List<Dossier> dossiers = new ArrayList<>();

        addRequests(requestNodes, requestDossiers, dossiers);

        Map<UUID, Node> quotationNodes = new LinkedHashMap<>();
        Map<UUID, SalesQuotationWorkspaceApi.Quotation> quotationSnapshots = new HashMap<>();
        Map<UUID, Dossier> dossierByQuotationId = new HashMap<>();
        addQuotations(requestNodes, requestDossiers, quotationNodes, quotationSnapshots,
                dossierByQuotationId, dossiers);

        Map<UUID, Node> orderNodes = new LinkedHashMap<>();
        Map<UUID, Dossier> orderDossiers = new HashMap<>();
        List<SalesOrderWorkspaceApi.Order> orderSnapshots = orders.orders();
        addOrders(quotationNodes, quotationSnapshots, dossierByQuotationId,
                orderNodes, orderDossiers, orderSnapshots, dossiers);

        addMissingOrderWarnings(quotationNodes, quotationSnapshots, orderSnapshots);
        addInvoices(orderNodes, orderDossiers, dossiers);

        return dossiers.stream()
                .collect(Collectors.toMap(
                        Dossier::id,
                        dossier -> dossier,
                        (first, duplicate) -> first,
                        LinkedHashMap::new))
                .values().stream()
                .toList();
    }

    private void addRequests(
            Map<UUID, Node> requestNodes,
            Map<UUID, Dossier> requestDossiers,
            List<Dossier> dossiers) {
        for (var request : quotations.requests()) {
            Node node = new Node(
                    DocumentType.REQUEST,
                    request.id(),
                    "DEM-" + request.id().toString().substring(0, 8).toUpperCase(Locale.ROOT),
                    request.status(),
                    request.customerName(),
                    null,
                    null,
                    request.lastActivity());
            requestNodes.put(request.id(), node);
            Dossier dossier = new Dossier(node);
            dossiers.add(dossier);
            requestDossiers.put(request.id(), dossier);
        }
    }

    private void addQuotations(
            Map<UUID, Node> requestNodes,
            Map<UUID, Dossier> requestDossiers,
            Map<UUID, Node> quotationNodes,
            Map<UUID, SalesQuotationWorkspaceApi.Quotation> quotationSnapshots,
            Map<UUID, Dossier> dossierByQuotationId,
            List<Dossier> dossiers) {
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
                    quotation.orderId());
            quotationNodes.put(quotation.id(), node);
            quotationSnapshots.put(quotation.id(), quotation);

            Node requestNode = quotation.requestId() == null
                    ? null
                    : requestNodes.get(quotation.requestId());
            if (requestNode == null) {
                if (quotation.requestId() != null) {
                    node.addWarning("La demande d’origine référencée est introuvable.");
                }
                Dossier dossier = new Dossier(node);
                dossiers.add(dossier);
                dossierByQuotationId.put(quotation.id(), dossier);
            } else {
                requestNode.addChild(node);
                dossierByQuotationId.put(quotation.id(), requestDossiers.get(quotation.requestId()));
            }
        }
    }

    private void addOrders(
            Map<UUID, Node> quotationNodes,
            Map<UUID, SalesQuotationWorkspaceApi.Quotation> quotationSnapshots,
            Map<UUID, Dossier> dossierByQuotationId,
            Map<UUID, Node> orderNodes,
            Map<UUID, Dossier> orderDossiers,
            List<SalesOrderWorkspaceApi.Order> orderSnapshots,
            List<Dossier> dossiers) {
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
                    order.lastActivity());
            orderNodes.put(order.id(), node);

            UUID reverseQuotationId = "QUOTATION".equals(order.source()) ? order.sourceId() : null;
            UUID forwardQuotationId = quotationByOrderId.get(order.id());
            if (reverseQuotationId != null && forwardQuotationId != null
                    && !reverseQuotationId.equals(forwardQuotationId)) {
                node.addWarning("Les références de la soumission et de la commande sont incohérentes.");
                Dossier dossier = new Dossier(node);
                dossiers.add(dossier);
                orderDossiers.put(order.id(), dossier);
                continue;
            }

            UUID quotationId = reverseQuotationId != null ? reverseQuotationId : forwardQuotationId;
            Node quotationNode = quotationId == null ? null : quotationNodes.get(quotationId);
            if (quotationNode == null) {
                if (reverseQuotationId != null || forwardQuotationId != null) {
                    node.addWarning("La soumission d’origine référencée est introuvable.");
                }
                Dossier dossier = new Dossier(node);
                dossiers.add(dossier);
                orderDossiers.put(order.id(), dossier);
                continue;
            }

            if (reverseQuotationId == null || forwardQuotationId == null) {
                node.addWarning("La relation avec la soumission est partielle.");
            }
            quotationNode.addChild(node);
            Dossier dossier = dossierByQuotationId.get(quotationId);
            if (dossier == null) {
                dossier = new Dossier(quotationNode);
                dossiers.add(dossier);
                dossierByQuotationId.put(quotationId, dossier);
            }
            orderDossiers.put(order.id(), dossier);
        }
    }

    private void addMissingOrderWarnings(
            Map<UUID, Node> quotationNodes,
            Map<UUID, SalesQuotationWorkspaceApi.Quotation> quotationSnapshots,
            List<SalesOrderWorkspaceApi.Order> orderSnapshots) {
        Map<UUID, SalesOrderWorkspaceApi.Order> orderSnapshotsById = orderSnapshots.stream()
                .collect(Collectors.toMap(SalesOrderWorkspaceApi.Order::id, order -> order));
        for (var quotation : quotationSnapshots.values()) {
            if (quotation.orderId() != null && !orderSnapshotsById.containsKey(quotation.orderId())) {
                quotationNodes.get(quotation.id())
                        .addWarning("La commande issue de cette soumission est introuvable.");
            }
        }
    }

    private void addInvoices(
            Map<UUID, Node> orderNodes,
            Map<UUID, Dossier> orderDossiers,
            List<Dossier> dossiers) {
        for (var invoice : invoices.invoices()) {
            Node node = new Node(
                    DocumentType.INVOICE,
                    invoice.id(),
                    invoice.reference(),
                    invoice.status(),
                    invoice.paymentStatus(),
                    invoice.paidAt(),
                    invoice.issuedAt(),
                    invoice.customerName(),
                    invoice.description(),
                    invoice.amountCents(),
                    invoice.lastActivity(),
                    invoice.orderId());
            Node orderNode = orderNodes.get(invoice.orderId());
            if (orderNode == null) {
                node.addWarning("La commande d’origine référencée est introuvable.");
                dossiers.add(new Dossier(node));
                continue;
            }
            orderNode.addChild(node);
            Dossier dossier = orderDossiers.get(invoice.orderId());
            if (dossier == null) {
                dossier = new Dossier(orderNode);
                dossiers.add(dossier);
                orderDossiers.put(invoice.orderId(), dossier);
            }
        }
    }

}
