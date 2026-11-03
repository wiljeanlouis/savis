package com.savouretplus.savis.sales.workspace.domain;

import java.util.ArrayList;
import java.util.List;

public final class ActionPolicy {
    private ActionPolicy() {
    }

    public static boolean requiresAction(Node node) {
        var invoices = flatten(node).stream()
                .filter(child -> child.type() == DocumentType.INVOICE)
                .toList();
        if (!invoices.isEmpty() && invoices.stream().allMatch(invoice -> "PAID".equals(invoice.paymentStatus()))) {
            return false;
        }
        if (node.children().stream().anyMatch(ActionPolicy::requiresAction)) {
            return true;
        }
        return switch (node.type()) {
            case REQUEST -> switch (node.status()) {
                case "RECEIVED", "IN_PROGRESS", "QUOTED" -> true;
                default -> false;
            };
            case QUOTATION -> switch (node.status()) {
                case "DRAFT", "SENT" -> true;
                case "ACCEPTED" -> node.orderId() == null || node.children().isEmpty();
                default -> false;
            };
            case ORDER -> switch (node.status()) {
                case "NEW", "ACCEPTED", "IN_PREPARATION", "READY" -> true;
                default -> false;
            };
            case INVOICE -> switch (node.status()) {
                case "DRAFT" -> true;
                case "ISSUED" -> !"PAID".equals(node.paymentStatus());
                default -> false;
            };
        };
    }

    private static List<Node> flatten(Node root) {
        List<Node> nodes = new ArrayList<>();
        nodes.add(root);
        root.children().forEach(child -> nodes.addAll(flatten(child)));
        return nodes;
    }
}
