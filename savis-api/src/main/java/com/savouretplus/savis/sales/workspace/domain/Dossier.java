package com.savouretplus.savis.sales.workspace.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

/** Commercial view of a connected request, quotation, order, and invoice branch. */
public final class Dossier {
    private final Node root;
    private final String id;

    public Dossier(Node root) {
        this.root = root;
        this.id = root.type().name() + ":" + root.publicId();
    }

    public String id() {
        return id;
    }

    public Node root() {
        return root;
    }

    public DocumentType rootType() {
        return root.type();
    }

    public java.util.UUID rootPublicId() {
        return root.publicId();
    }

    public String customerName() {
        return root.customerName();
    }

    public String reference() {
        return root.reference();
    }

    public String description() {
        return root.description();
    }

    public Instant lastActivity() {
        return flatten(root).stream()
                .map(Node::lastActivity)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);
    }

    /**
     * Searches references and customer names across the whole tree.
     *
     * @param needle already lower-cased search text, using Locale.ROOT
     * @return whether any non-null searchable field contains the text
     */
    public boolean matches(String needle) {
        List<String> values = new ArrayList<>();
        root.collectMatches(values);
        return values.stream().filter(Objects::nonNull)
                .anyMatch(value -> value.toLowerCase(Locale.ROOT).contains(needle));
    }

    public boolean requiresAction() {
        return ActionPolicy.requiresAction(root);
    }

    public String situation() {
        return Situation.describe(root);
    }

    /** @return number of descendant documents, excluding the root */
    public int documentCount() {
        return flatten(root).size() - 1;
    }

    private static List<Node> flatten(Node root) {
        List<Node> nodes = new ArrayList<>();
        nodes.add(root);
        root.children().forEach(child -> nodes.addAll(flatten(child)));
        return nodes;
    }
}
