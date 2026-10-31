package com.savouretplus.savis.order.domain;

/**
 * Represents a snapshot of a choice selected for an ordered item.
 */
public record OrderItemChoiceSelection(
        Long id,
        String choiceId,
        String choiceName,
        String groupLabel) {
}
