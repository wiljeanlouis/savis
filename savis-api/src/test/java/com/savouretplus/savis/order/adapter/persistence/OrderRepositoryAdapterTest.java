package com.savouretplus.savis.order.adapter.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderAddress;
import com.savouretplus.savis.order.domain.OrderItem;
import com.savouretplus.savis.order.domain.OrderItemAllocationType;
import com.savouretplus.savis.order.domain.OrderItemChoiceAllocation;
import com.savouretplus.savis.order.domain.OrderItemChoiceSelection;
import com.savouretplus.savis.order.domain.OrderItemIngredientSelection;
import com.savouretplus.savis.order.domain.OrderItemProductType;
import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.domain.OrderStatus;
import com.savouretplus.savis.order.port.OrderRepository;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class OrderRepositoryAdapterTest {
    private static final UUID EXTERNAL_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");

    @Autowired OrderRepository repository;

    @Test
    void persistsTheNormalizedSnapshotAndRejectsADuplicateExternalOrder() {
        Order saved = repository.save(order("WEB-00000001", EXTERNAL_ID));

        Order reloaded = repository.findByPublicId(saved.publicId()).orElseThrow();
        assertEquals("Pâtés assortis", reloaded.items().getFirst().productNameSnapshot());
        assertEquals("Poulet", reloaded.items().getFirst().choiceSelections().getFirst().choiceName());
        assertEquals(6, reloaded.items().getFirst().choiceAllocations().getFirst().quantity());
        assertEquals(1, reloaded.items().getFirst().ingredientSelections().getFirst().defaultQuantity());
        assertEquals("Drummondville", reloaded.customerAddress().city());
        assertEquals(150, reloaded.discountCents());
        assertEquals(300, reloaded.deliveryFeeCents());

        assertThrows(
                DataIntegrityViolationException.class,
                () -> repository.save(order("WEB-00000002", EXTERNAL_ID)));
    }

    private Order order(String number, UUID externalId) {
        Instant now = Instant.parse("2026-08-08T15:00:00Z");
        OrderItem item = new OrderItem(
                null, null, UUID.randomUUID(), "Pâtés assortis", OrderItemProductType.SINGLE_CHOICE_BUNDLE,
                "/pates.jpg", 1, 3000, 3150, 3150, "dozen", "Douzaine", 12,
                OrderItemAllocationType.CHOICE_ALLOCATION, "raw-key",
                List.of(new OrderItemChoiceSelection(null, "chicken", "Poulet", "Saveur")),
                List.of(new OrderItemChoiceAllocation(null, "chicken", "Poulet", 6)),
                List.of(new OrderItemIngredientSelection(null, "spice", "Épices", 2, 1, 150)));
        return new Order(
                null, null, number, OrderSource.SAVOURETPLUS_WEB, OrderStatus.NEW,
                "Ada", "514", null,
                new OrderAddress("416 rue Lindsay", null, "Drummondville", "QC", "J2B 1G6"),
                null, 150, 300, 3300, externalId, now, now,
                null, null, null, null, null, List.of(item), Map.of("source", "savouretplus"));
    }
}
