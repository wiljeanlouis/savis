package com.savouretplus.savis.sales.workspace.domain;

import java.util.List;

/** Produces French display summaries from branch outcomes, independently of the attention flag. */
public final class Situation {
    private Situation() {
    }

    /**
     * Groups immediate request branches by their displayed outcome and counts them.
     * Within a branch, a direct invoice takes precedence over the first child.
     *
     * @param node dossier root
     * @return counted French outcomes separated by a middle dot
     */
    public static String describe(Node node) {
        List<String> outcomes = node.type() == DocumentType.REQUEST && !node.children().isEmpty()
                ? node.children().stream().map(Situation::branchSituation).toList()
                : List.of(branchSituation(node));
        var counts = outcomes.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        value -> value,
                        java.util.LinkedHashMap::new,
                        java.util.stream.Collectors.counting()));
        return counts.entrySet().stream()
                .map(entry -> entry.getValue() + " " + pluralize(entry.getKey(), entry.getValue()))
                .collect(java.util.stream.Collectors.joining(" · "));
    }

    private static String branchSituation(Node node) {
        if (!node.children().isEmpty()) {
            Node invoice = node.children().stream()
                    .filter(child -> child.type() == DocumentType.INVOICE)
                    .findFirst()
                    .orElse(null);
            if (invoice != null) {
                if ("ISSUED".equals(invoice.status())) {
                    return "PAID".equals(invoice.paymentStatus()) ? "branche réglée" : "branche facturée";
                }
                return switch (invoice.status()) {
                    case "DRAFT" -> "facture brouillon";
                    default -> "facture annulée";
                };
            }
            return branchSituation(node.children().getFirst());
        }
        return switch (node.type()) {
            case REQUEST -> switch (node.status()) {
                case "RECEIVED" -> "demande reçue";
                case "IN_PROGRESS" -> "demande en préparation";
                case "QUOTED" -> "demande soumise";
                default -> "demande clôturée";
            };
            case QUOTATION -> switch (node.status()) {
                case "DRAFT" -> "soumission en brouillon";
                case "SENT" -> "soumission en attente";
                case "ACCEPTED" -> "soumission acceptée";
                default -> "soumission refusée";
            };
            case ORDER -> orderSituation(node.status());
            case INVOICE -> switch (node.status()) {
                case "ISSUED" -> "PAID".equals(node.paymentStatus()) ? "branche réglée" : "branche facturée";
                case "DRAFT" -> "facture brouillon";
                default -> "facture annulée";
            };
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
}
