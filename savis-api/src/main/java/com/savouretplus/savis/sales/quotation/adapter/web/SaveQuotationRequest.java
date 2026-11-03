package com.savouretplus.savis.sales.quotation.adapter.web;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.sales.quotation.domain.QuotationAddress;
import com.savouretplus.savis.sales.quotation.usecase.SaveQuotationCommand;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

/** Represents editable data used to create or replace a draft quotation. */
public record SaveQuotationRequest(
        @NotBlank String customerName,
        @NotBlank String customerPhone,
        @Email String customerEmail,
        @Valid AddressRequest customerAddress,
        @NotNull LocalDate validUntil,
        String note,
        @PositiveOrZero int discountCents,
        @PositiveOrZero int deliveryFeeCents,
        @NotEmpty List<@Valid ItemRequest> items) {

    /** Converts the HTTP request to the application command. */
    SaveQuotationCommand toCommand() {
        return new SaveQuotationCommand(
                customerName, customerPhone, customerEmail,
                customerAddress == null ? null : customerAddress.toDomain(),
                validUntil, note, discountCents, deliveryFeeCents,
                items.stream().map(ItemRequest::toCommand).toList());
    }

    /** Represents an optional structured customer address. */
    public record AddressRequest(String line1, String line2, String city, String province, String postalCode) {
        private QuotationAddress toDomain() {
            QuotationAddress address = new QuotationAddress(line1, line2, city, province, postalCode);
            return address.isEmpty() ? null : address;
        }
    }

    /** Represents one configured catalog product. */
    public record ItemRequest(
            @NotNull UUID productId,
            @Positive int quantity,
            String purchaseModeCode,
            String choiceCode,
            List<@Valid ChoiceAllocationRequest> allocations,
            List<@Valid IngredientSelectionRequest> ingredients) {

        private SaveQuotationCommand.Item toCommand() {
            return new SaveQuotationCommand.Item(
                    productId, quantity, purchaseModeCode, choiceCode,
                    safe(allocations).stream().map(ChoiceAllocationRequest::toCommand).toList(),
                    safe(ingredients).stream().map(IngredientSelectionRequest::toCommand).toList());
        }
    }

    /** Represents a quantity allocated to one configured choice. */
    public record ChoiceAllocationRequest(@NotBlank String choiceCode, @Positive int quantity) {
        private SaveQuotationCommand.ChoiceAllocation toCommand() {
            return new SaveQuotationCommand.ChoiceAllocation(choiceCode, quantity);
        }
    }

    /** Represents a selected ingredient quantity. */
    public record IngredientSelectionRequest(@NotBlank String ingredientCode, @PositiveOrZero int quantity) {
        private SaveQuotationCommand.IngredientSelection toCommand() {
            return new SaveQuotationCommand.IngredientSelection(ingredientCode, quantity);
        }
    }

    private static <T> List<T> safe(List<T> values) {
        return values != null ? values : List.of();
    }
}
