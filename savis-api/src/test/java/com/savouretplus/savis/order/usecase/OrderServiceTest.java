package com.savouretplus.savis.order.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderAddress;
import com.savouretplus.savis.order.domain.OrderItem;
import com.savouretplus.savis.order.domain.OrderItemAllocationType;
import com.savouretplus.savis.order.domain.OrderItemProductType;
import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.domain.OrderStatus;
import com.savouretplus.savis.order.port.OrderCatalog;
import com.savouretplus.savis.order.port.OrderBomRequirements;
import com.savouretplus.savis.order.port.OrderNumberGenerator;
import com.savouretplus.savis.order.port.OrderRepository;
import com.savouretplus.savis.order.port.OrderSourcing;
import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Unit;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    private static final Instant NOW = Instant.parse("2026-08-08T15:00:00Z");
    private static final UUID ORDER_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID PRODUCT_ID = UUID.fromString("20000000-0000-4000-8000-000000000002");

    @Mock OrderRepository repository;
    @Mock OrderCatalog catalog;
    @Mock OrderBomRequirements bomRequirements;
    @Mock OrderSourcing sourcing;
    @Mock OrderNumberGenerator orderNumbers;

    @Test
    void createsAnAdministrativeOrderFromCatalogSnapshots() {
        OrderCatalog.ProductSelection selection = new OrderCatalog.ProductSelection(
                PRODUCT_ID, "unit", "vanilla", List.of(), List.of());
        when(catalog.snapshot(selection)).thenReturn(new OrderCatalog.ProductSnapshot(
                PRODUCT_ID,
                "Cupcake",
                OrderItemProductType.SINGLE_CHOICE,
                "/cupcake.jpg",
                450,
                450,
                new OrderCatalog.PurchaseMode("unit", "Unité", 1, OrderItemAllocationType.SINGLE_CHOICE),
                new OrderCatalog.ChoiceSelection("vanilla", "Vanille", "Saveur"),
                List.of(),
                List.of()));
        when(orderNumbers.next(OrderSource.ADMIN)).thenReturn("ADM-00000001");
        when(repository.save(org.mockito.ArgumentMatchers.any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        OrderService service = service();
        CreateOrderCommand command = new CreateOrderCommand(
                "Ada", "514", "ada@example.com",
                new OrderAddress("123 rue Principale", null, "Montréal", "QC", "H1H 1H1"),
                "Livrer à 15 h", 100, 250,
                List.of(new CreateOrderCommand.Item(
                        PRODUCT_ID, 3, "unit", "vanilla", List.of(), List.of())));

        Order created = service.create(command);

        assertEquals(OrderSource.ADMIN, created.source());
        assertEquals(OrderStatus.NEW, created.status());
        assertEquals("ADM-00000001", created.orderNumber());
        assertEquals(1500, created.totalCents());
        assertEquals(1350, created.subtotalCents());
        assertEquals(100, created.discountCents());
        assertEquals(250, created.deliveryFeeCents());
        assertEquals("Montréal", created.customerAddress().city());
        assertEquals(NOW, created.placedAt());
        assertEquals("Vanille", created.items().getFirst().choiceSelections().getFirst().choiceName());
        verify(repository).save(created);
    }

    @Test
    void replacesANewAdministrativeOrderAndRecalculatesItsSnapshots() {
        Order initial = administrativeOrder(OrderStatus.NEW);
        OrderCatalog.ProductSelection selection = new OrderCatalog.ProductSelection(
                PRODUCT_ID, "unit", "vanilla", List.of(), List.of());
        when(repository.findByPublicId(ORDER_ID)).thenReturn(Optional.of(initial));
        when(catalog.snapshot(selection)).thenReturn(new OrderCatalog.ProductSnapshot(
                PRODUCT_ID,
                "Cupcake actualisé",
                OrderItemProductType.SINGLE_CHOICE,
                "/cupcake-new.jpg",
                500,
                500,
                new OrderCatalog.PurchaseMode("unit", "Unité", 1, OrderItemAllocationType.SINGLE_CHOICE),
                new OrderCatalog.ChoiceSelection("vanilla", "Vanille", "Saveur"),
                List.of(),
                List.of()));
        when(repository.save(org.mockito.ArgumentMatchers.any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        CreateOrderCommand command = new CreateOrderCommand(
                "Ada modifiée", "438", "new@example.com", null,
                "Nouvelle note", 100, 200,
                List.of(new CreateOrderCommand.Item(
                        PRODUCT_ID, 2, "unit", "vanilla", List.of(), List.of())));

        Order updated = service().update(ORDER_ID, command);

        assertEquals(ORDER_ID, updated.publicId());
        assertEquals("ADM-00000001", updated.orderNumber());
        assertEquals(OrderSource.ADMIN, updated.source());
        assertEquals(OrderStatus.NEW, updated.status());
        assertEquals("Ada modifiée", updated.customerName());
        assertEquals(1100, updated.totalCents());
        assertEquals("Cupcake actualisé", updated.items().getFirst().productNameSnapshot());
        assertEquals(NOW, updated.placedAt());
        verify(repository).save(updated);
    }

    @Test
    void rejectsReplacingAWebOrderOrANonNewAdministrativeOrder() {
        when(repository.findByPublicId(ORDER_ID))
                .thenReturn(Optional.of(order(OrderStatus.NEW)))
                .thenReturn(Optional.of(administrativeOrder(OrderStatus.ACCEPTED)));
        CreateOrderCommand command = new CreateOrderCommand(
                "Ada", "514", null, null, List.of());

        assertThrows(IllegalStateException.class, () -> service().update(ORDER_ID, command));
        assertThrows(IllegalStateException.class, () -> service().update(ORDER_ID, command));
    }

    @Test
    void acceptsANewOrderAndRecordsTheTimestamp() {
        Order initial = order(OrderStatus.NEW);
        when(repository.findByPublicId(ORDER_ID)).thenReturn(Optional.of(initial));
        when(repository.save(org.mockito.ArgumentMatchers.any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        OrderService service = service();

        Order changed = service.updateStatus(ORDER_ID, OrderStatus.ACCEPTED);

        assertEquals(OrderStatus.ACCEPTED, changed.status());
        assertEquals(NOW, changed.acceptedAt());
        verify(repository).save(changed);
    }

    @Test
    void rejectsSkippingFromNewDirectlyToReady() {
        when(repository.findByPublicId(ORDER_ID)).thenReturn(Optional.of(order(OrderStatus.NEW)));
        OrderService service = service();

        assertThrows(IllegalStateException.class, () -> service.updateStatus(ORDER_ID, OrderStatus.READY));
    }

    @Test
    void generatesAggregatedRequirementsWithConvertedUnitsSourcesAndSourcing() {
        UUID firstBomId = UUID.randomUUID();
        UUID secondBomId = UUID.randomUUID();
        UUID offerId = UUID.randomUUID();
        OrderItem item = new OrderItem(
                null,
                UUID.randomUUID(),
                PRODUCT_ID,
                "Pâtés assortis",
                OrderItemProductType.SINGLE_CHOICE_BUNDLE,
                null,
                2,
                1000,
                1000,
                2000,
                "box",
                "Boîte",
                15,
                OrderItemAllocationType.CHOICE_ALLOCATION,
                null,
                List.of(),
                List.of(),
                List.of());
        Order order = new Order(
                1L, ORDER_ID, "WEB-00000001", OrderSource.SAVOURETPLUS_WEB, OrderStatus.NEW,
                "Ada", "514", null, null, 2000, UUID.randomUUID(), NOW, NOW,
                null, null, null, null, null, List.of(item), Map.of());
        when(repository.findByPublicId(ORDER_ID)).thenReturn(Optional.of(order));
        when(catalog.bomPlan(org.mockito.ArgumentMatchers.any())).thenReturn(new OrderCatalog.BomPlan(
                List.of(
                        new OrderCatalog.ApplicableBom(firstBomId, new BigDecimal("10"), "Poulet"),
                        new OrderCatalog.ApplicableBom(secondBomId, new BigDecimal("5"), "Thon")),
                List.of()));
        when(bomRequirements.getRequirements(firstBomId, new BigDecimal("20")))
                .thenReturn(new OrderBomRequirements.BomRequirements(
                        firstBomId,
                        "Pâté poulet",
                        List.of(new OrderBomRequirements.ComponentRequirement(
                                "Farine", new BigDecimal("500"), Unit.GRAM, offerId))));
        when(bomRequirements.getRequirements(secondBomId, new BigDecimal("10")))
                .thenReturn(new OrderBomRequirements.BomRequirements(
                        secondBomId,
                        "Pâté thon",
                        List.of(new OrderBomRequirements.ComponentRequirement(
                                "farine", new BigDecimal("1.5"), Unit.KILOGRAM, offerId))));
        when(sourcing.findCurrent("farine", new BigDecimal("2"), Unit.KILOGRAM, offerId))
                .thenReturn(Optional.of(new OrderSourcing.SourcingInformation(
                        offerId,
                        "Sac de farine",
                        "https://example.com/flour.jpg",
                        "Sans Nom",
                        "Maxi",
                        new BigDecimal("5"),
                        Unit.KILOGRAM,
                        Money.of(6),
                        LocalDateTime.parse("2026-08-08T12:00:00"))));

        OrderRequirementReport report = service().requirementReport(ORDER_ID);

        assertEquals(true, report.complete());
        assertEquals(1, report.requirements().size());
        OrderRequirementReport.OrderRequirement flour = report.requirements().getFirst();
        assertEquals("farine", flour.componentName());
        assertEquals(0, flour.requiredQuantity().compareTo(new BigDecimal("2")));
        assertEquals("kg", flour.unit());
        assertEquals(2, flour.sources().size());
        assertEquals("Sac de farine", flour.sourcingInformation().productName());
        assertEquals("https://example.com/flour.jpg", flour.sourcingInformation().imageUrl());
        assertEquals(0, flour.sources().getFirst().quantityContribution().compareTo(new BigDecimal("0.5")));
        assertEquals(null, flour.onHandQuantity());
    }

    private Order order(OrderStatus status) {
        return new Order(
                1L, ORDER_ID, "WEB-00000001", OrderSource.SAVOURETPLUS_WEB, status,
                "Ada", "514", null, null, 1200, UUID.randomUUID(), NOW, NOW,
                null, null, null, null, null, List.of(), Map.of());
    }

    private Order administrativeOrder(OrderStatus status) {
        return new Order(
                1L, ORDER_ID, "ADM-00000001", OrderSource.ADMIN, status,
                "Ada", "514", null, null, 1200, null, NOW, NOW,
                status == OrderStatus.ACCEPTED ? NOW : null,
                null, null, null, null, List.of(), Map.of());
    }

    private OrderService service() {
        return new OrderService(
                repository,
                catalog,
                bomRequirements,
                sourcing,
                orderNumbers,
                Clock.fixed(NOW, ZoneOffset.UTC));
    }
}
