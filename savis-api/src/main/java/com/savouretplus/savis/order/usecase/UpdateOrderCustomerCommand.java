package com.savouretplus.savis.order.usecase;

import com.savouretplus.savis.order.domain.OrderAddress;

/**
 * Describes corrected customer information for an imported web order.
 */
public record UpdateOrderCustomerCommand(
        String customerName,
        String customerPhone,
        String customerEmail,
        OrderAddress customerAddress,
        String note) {
}
