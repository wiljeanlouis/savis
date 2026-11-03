package com.savouretplus.savis.sales.order.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.savouretplus.savis.sales.order.domain.OrderItemAllocationType;
import com.savouretplus.savis.sales.order.domain.OrderItemProductType;
import com.savouretplus.savis.sales.order.domain.OrderStatus;
import com.savouretplus.savis.sales.order.port.PendingCustomerOrder;

class CustomerOrderImportMapperTest {
    private static final UUID EXTERNAL_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID PRODUCT_ID = UUID.fromString("20000000-0000-4000-8000-000000000002");
    private static final Instant PLACED_AT = Instant.parse("2026-08-08T14:00:00Z");
    private static final Instant IMPORTED_AT = Instant.parse("2026-08-08T15:00:00Z");

    private final CustomerOrderImportMapper mapper = new CustomerOrderImportMapper();

    @Test
    void mapsIngredientCustomizationWithoutRepricingSnapshots() {
        var ingredient = new PendingCustomerOrder.IngredientSelection(
                "sprinkles", "Confettis", 2, 1, 150);
        var sourceItem = new PendingCustomerOrder.Item(
                PRODUCT_ID,
                "Biscuit personnalisé",
                "ingredient_customization",
                "/cookie.jpg",
                3,
                800,
                950,
                null,
                null,
                List.of(),
                List.of(ingredient),
                "cookie:default:none::sprinkles:2");

        var order = mapper.map(source(sourceItem, 2850), "WEB-00000001", IMPORTED_AT);

        assertEquals(OrderStatus.NEW, order.status());
        assertEquals(2850, order.totalCents());
        assertEquals(EXTERNAL_ID, order.externalOrderId());
        assertEquals(PLACED_AT, order.placedAt());
        var item = order.items().getFirst();
        assertEquals(OrderItemProductType.INGREDIENT_CUSTOMIZATION, item.productType());
        assertEquals(800, item.basePriceCents());
        assertEquals(950, item.unitPriceCents());
        assertEquals(2850, item.lineTotalCents());
        assertNull(item.purchaseModeId());
        assertEquals(OrderItemAllocationType.NONE, item.allocationType());
        assertEquals(1, item.ingredientSelections().size());
        assertEquals(1, item.ingredientSelections().getFirst().defaultQuantity());
        assertEquals(150, item.ingredientSelections().getFirst().extraPriceCents());
    }

    @Test
    void mapsSingleChoiceBundleSelectionAndDozenAllocation() {
        var purchaseMode = new PendingCustomerOrder.PurchaseMode(
                "dozen", "Douzaine", 12, "choice_allocation");
        var selection = new PendingCustomerOrder.ChoiceSelection("chicken", "Poulet", "Saveur");
        var sourceItem = new PendingCustomerOrder.Item(
                PRODUCT_ID,
                "Pâtés assortis",
                "single_choice_bundle",
                "/pates.jpg",
                2,
                3000,
                3000,
                purchaseMode,
                selection,
                List.of(
                        new PendingCustomerOrder.ChoiceAllocation("chicken", "Poulet", 6),
                        new PendingCustomerOrder.ChoiceAllocation("beef", "Boeuf", 6)),
                List.of(),
                "pate:dozen:none:chicken:6|beef:6:");

        var item = mapper.map(source(sourceItem, 6000), "WEB-00000002", IMPORTED_AT).items().getFirst();

        assertEquals(OrderItemProductType.SINGLE_CHOICE_BUNDLE, item.productType());
        assertEquals("dozen", item.purchaseModeId());
        assertEquals(12, item.purchaseModeQuantity());
        assertEquals(OrderItemAllocationType.CHOICE_ALLOCATION, item.allocationType());
        assertEquals("Poulet", item.choiceSelections().getFirst().choiceName());
        assertEquals(2, item.choiceAllocations().size());
        assertEquals(12, item.choiceAllocations().stream().mapToInt(value -> value.quantity()).sum());
        assertEquals(6000, item.lineTotalCents());
    }

    @Test
    void rejectsAnExternalTotalThatDoesNotMatchItsCapturedLines() {
        var sourceItem = new PendingCustomerOrder.Item(
                PRODUCT_ID, "Service", "standard", null, 2, 1200, 1200,
                null, null, List.of(), List.of(), "service");

        assertThrows(IllegalArgumentException.class,
                () -> mapper.map(source(sourceItem, 2399), "WEB-00000003", IMPORTED_AT));
    }

    private PendingCustomerOrder source(PendingCustomerOrder.Item item, int totalCents) {
        return new PendingCustomerOrder(
                EXTERNAL_ID,
                "Ada",
                "514-555-0100",
                "ada@example.com",
                null,
                "new",
                "savouretplus",
                totalCents,
                List.of(item),
                PLACED_AT,
                Map.of("id", EXTERNAL_ID.toString(), "customer_name", "Ada"));
    }
}
