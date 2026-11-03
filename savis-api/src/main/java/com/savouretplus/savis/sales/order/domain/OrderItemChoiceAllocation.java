package com.savouretplus.savis.sales.order.domain;

/**
 * Represents a snapshot of one allocated choice and its quantity.
 */
public record OrderItemChoiceAllocation(
        Long id,
        String choiceId,
        String choiceName,
        int quantity) {
}
