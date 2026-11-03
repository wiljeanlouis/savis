package com.savouretplus.savis.sales.workspace.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class Node {
    private final DocumentType type;
    private final UUID publicId;
    private final String reference;
    private final String status;
    private final String paymentStatus;
    private final Instant paidAt;
    private final Instant issuedAt;
    private final String customerName;
    private final String description;
    private final Integer amountCents;
    private final Instant lastActivity;
    private final UUID orderId;
    private String action;
    private final String actionUrl;
    private final List<Node> children = new ArrayList<>();
    private final List<String> warnings = new ArrayList<>();

    public Node(
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
        this(type, publicId, reference, status, null, null, null, customerName, description, amountCents, lastActivity,
                null, action, actionUrl);
    }

    public Node(
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
        this(type, publicId, reference, status, null, null, null, customerName, description, amountCents, lastActivity,
                orderId, action, actionUrl);
    }

    public Node(
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
        this(type, publicId, reference, status, paymentStatus, paidAt, null, customerName, description, amountCents,
                lastActivity, orderId, action, actionUrl);
    }

    public Node(
            DocumentType type,
            UUID publicId,
            String reference,
            String status,
            String paymentStatus,
            Instant paidAt,
            Instant issuedAt,
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
        this.issuedAt = issuedAt;
        this.customerName = customerName;
        this.description = normalizeDescription(description);
        this.amountCents = amountCents;
        this.lastActivity = lastActivity;
        this.orderId = orderId;
        this.action = action;
        this.actionUrl = actionUrl;
    }

    public DocumentType type() {
        return type;
    }

    public UUID publicId() {
        return publicId;
    }

    public String reference() {
        return reference;
    }

    public String status() {
        return status;
    }

    public String paymentStatus() {
        return paymentStatus;
    }

    public Instant paidAt() {
        return paidAt;
    }

    public Instant issuedAt() {
        return issuedAt;
    }

    public String customerName() {
        return customerName;
    }

    public String description() {
        return description;
    }

    public Integer amountCents() {
        return amountCents;
    }

    public Instant lastActivity() {
        return lastActivity;
    }

    public UUID orderId() {
        return orderId;
    }

    public String action() {
        return action;
    }

    public String actionUrl() {
        return actionUrl;
    }

    public List<Node> children() {
        return List.copyOf(children);
    }

    public List<String> warnings() {
        return List.copyOf(warnings);
    }

    public void addChild(Node child) {
        children.add(child);
    }

    public void addWarning(String warning) {
        warnings.add(warning);
    }

    public void setAction(String action) {
        this.action = action;
    }

    public void collectMatches(List<String> values) {
        values.add(reference);
        values.add(customerName);
        children.forEach(child -> child.collectMatches(values));
    }

    private static String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }
        String normalized = description.strip();
        return normalized.substring(0, Math.min(normalized.length(), 140));
    }
}
