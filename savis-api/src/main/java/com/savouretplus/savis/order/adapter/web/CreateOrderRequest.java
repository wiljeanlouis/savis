package com.savouretplus.savis.order.adapter.web;

import java.util.List;
import java.util.UUID;

import com.savouretplus.savis.order.usecase.CreateOrderCommand;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * Represents an administrative order-creation request.
 */
public record CreateOrderRequest(
        @NotBlank String customerName,
        @NotBlank String customerPhone,
        @Email String customerEmail,
        String note,
        @NotEmpty List<@Valid ItemRequest> items) {

    /**
     * Converts this request into its application command.
     */
    CreateOrderCommand toCommand() {
        return new CreateOrderCommand(
                customerName,
                customerPhone,
                customerEmail,
                note,
                items.stream().map(ItemRequest::toCommand).toList());
    }

    /**
     * Represents one configured catalog product in the request.
     */
    public record ItemRequest(
            @NotNull UUID productId,
            @Positive int quantity,
            String purchaseModeCode,
            String choiceCode,
            List<@Valid ChoiceAllocationRequest> allocations,
            List<@Valid IngredientSelectionRequest> ingredients) {

        /**
         * Converts this item request into its application command.
         */
        CreateOrderCommand.Item toCommand() {
            return new CreateOrderCommand.Item(
                    productId,
                    quantity,
                    purchaseModeCode,
                    choiceCode,
                    safe(allocations).stream().map(ChoiceAllocationRequest::toCommand).toList(),
                    safe(ingredients).stream().map(IngredientSelectionRequest::toCommand).toList());
        }
    }

    /**
     * Represents one choice allocation in the request.
     */
    public record ChoiceAllocationRequest(@NotBlank String choiceCode, @Positive int quantity) {

        /**
         * Converts this allocation request into its application command.
         */
        CreateOrderCommand.ChoiceAllocation toCommand() {
            return new CreateOrderCommand.ChoiceAllocation(choiceCode, quantity);
        }
    }

    /**
     * Represents one ingredient quantity in the request.
     */
    public record IngredientSelectionRequest(@NotBlank String ingredientCode, @PositiveOrZero int quantity) {

        /**
         * Converts this ingredient request into its application command.
         */
        CreateOrderCommand.IngredientSelection toCommand() {
            return new CreateOrderCommand.IngredientSelection(ingredientCode, quantity);
        }
    }

    private static <T> List<T> safe(List<T> values) {
        return values != null ? values : List.of();
    }
}
