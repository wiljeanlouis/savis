package com.savouretplus.savis.order.adapter.web;

import com.savouretplus.savis.order.domain.OrderAddress;
import com.savouretplus.savis.order.usecase.UpdateOrderCustomerCommand;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Represents the customer fields that may be corrected on a new web order.
 */
public record UpdateOrderCustomerRequest(
        @NotBlank String customerName,
        @NotBlank String customerPhone,
        @Email String customerEmail,
        @Valid AddressRequest customerAddress,
        String note) {

    /**
     * Converts this request into its application command.
     */
    UpdateOrderCustomerCommand toCommand() {
        return new UpdateOrderCustomerCommand(
                customerName,
                customerPhone,
                customerEmail,
                customerAddress == null ? null : customerAddress.toDomain(),
                note);
    }

    /**
     * Represents an optional corrected customer address.
     */
    public record AddressRequest(
            String line1,
            String line2,
            String city,
            String province,
            String postalCode) {

        private OrderAddress toDomain() {
            OrderAddress address = new OrderAddress(line1, line2, city, province, postalCode);
            return address.isEmpty() ? null : address;
        }
    }
}
