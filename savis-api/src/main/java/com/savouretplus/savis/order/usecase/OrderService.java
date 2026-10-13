package com.savouretplus.savis.order.usecase;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.order.domain.CustomerContactNormalizer;
import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderItem;
import com.savouretplus.savis.order.domain.OrderItemChoiceAllocation;
import com.savouretplus.savis.order.domain.OrderItemChoiceSelection;
import com.savouretplus.savis.order.domain.OrderItemIngredientSelection;
import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.domain.OrderStatus;
import com.savouretplus.savis.order.port.OrderBomRequirements;
import com.savouretplus.savis.order.port.OrderCatalog;
import com.savouretplus.savis.order.port.OrderNumberGenerator;
import com.savouretplus.savis.order.port.OrderRepository;
import com.savouretplus.savis.order.port.OrderSourcing;
import com.savouretplus.savis.common.Unit;

import lombok.AllArgsConstructor;

/**
 * Coordinates administrative order creation, queries, and lifecycle changes.
 */
@Service
@Transactional
@AllArgsConstructor
public class OrderService {
    private final OrderRepository repository;
    private final OrderCatalog catalog;
    private final OrderBomRequirements bomRequirements;
    private final OrderSourcing sourcing;
    private final OrderNumberGenerator orderNumbers;
    private final Clock clock;

    /**
     * Creates and persists an administrative order from current catalog products.
     */
    public Order create(CreateOrderCommand command) {
        PreparedOrder prepared = prepare(command);
        Instant now = Instant.now(clock);
        Order order = new Order(
                null,
                UUID.randomUUID(),
                orderNumbers.next(OrderSource.ADMIN),
                OrderSource.ADMIN,
                OrderStatus.NEW,
                command.customerName(),
                CustomerContactNormalizer.normalizePhone(command.customerPhone()),
                blankToNull(command.customerEmail()),
                CustomerContactNormalizer.normalizeAddress(command.customerAddress()),
                blankToNull(command.note()),
                command.discountCents(),
                command.deliveryFeeCents(),
                prepared.totalCents(),
                null,
                now,
                now,
                null, null, null, null, null,
                prepared.items(),
                Map.of());
        return repository.save(order);
    }

    /**
     * Replaces an editable administrative order using current catalog snapshots.
     */
    public Order update(UUID orderId, CreateOrderCommand command) {
        Order current = get(orderId);
        if (current.source() != OrderSource.ADMIN) {
            throw new IllegalStateException("Une commande web ne peut pas être modifiée directement");
        }
        if (current.status() != OrderStatus.NEW) {
            throw new IllegalStateException("Seule une commande au statut NEW peut être modifiée");
        }

        PreparedOrder prepared = prepare(command);
        Order changed = new Order(
                current.id(),
                current.publicId(),
                current.orderNumber(),
                current.source(),
                current.status(),
                command.customerName(),
                CustomerContactNormalizer.normalizePhone(command.customerPhone()),
                blankToNull(command.customerEmail()),
                CustomerContactNormalizer.normalizeAddress(command.customerAddress()),
                blankToNull(command.note()),
                command.discountCents(),
                command.deliveryFeeCents(),
                prepared.totalCents(),
                current.externalOrderId(),
                current.placedAt(),
                current.importedAt(),
                current.acceptedAt(),
                current.inPreparationAt(),
                current.readyAt(),
                current.completedAt(),
                current.cancelledAt(),
                prepared.items(),
                current.rawPayload());
        return repository.save(changed);
    }

    /**
     * Corrects customer information on a new imported web order without changing its snapshots.
     */
    public Order updateWebCustomer(UUID orderId, UpdateOrderCustomerCommand command) {
        Order current = get(orderId);
        if (current.source() != OrderSource.SAVOURETPLUS_WEB) {
            throw new IllegalStateException("Cette correction est réservée aux commandes web");
        }
        if (current.status() != OrderStatus.NEW) {
            throw new IllegalStateException("Seule une commande web au statut NEW peut être corrigée");
        }

        Order changed = new Order(
                current.id(),
                current.publicId(),
                current.orderNumber(),
                current.source(),
                current.status(),
                command.customerName(),
                CustomerContactNormalizer.normalizePhone(command.customerPhone()),
                blankToNull(command.customerEmail()),
                CustomerContactNormalizer.normalizeAddress(command.customerAddress()),
                blankToNull(command.note()),
                current.discountCents(),
                current.deliveryFeeCents(),
                current.totalCents(),
                current.externalOrderId(),
                current.placedAt(),
                current.importedAt(),
                current.acceptedAt(),
                current.inPreparationAt(),
                current.readyAt(),
                current.completedAt(),
                current.cancelledAt(),
                current.items(),
                current.rawPayload());
        return repository.save(changed);
    }

    /**
     * Returns all orders for administration views.
     */
    @Transactional(readOnly = true)
    public List<Order> list() {
        return repository.findAll();
    }

    /**
     * Returns an order by its public identifier.
     */
    @Transactional(readOnly = true)
    public Order get(UUID orderId) {
        return repository.findByPublicId(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
    }

    /**
     * Generates an operational report of all components currently required by an order.
     */
    @Transactional(readOnly = true)
    public OrderRequirementReport requirementReport(UUID orderId) {
        Order order = get(orderId);
        ReportState state = new ReportState();
        Map<ComponentKey, RequirementAccumulator> requirements = new LinkedHashMap<>();
        Map<String, Set<String>> unitsByComponent = new LinkedHashMap<>();

        for (OrderItem item : order.items()) {
            addItemRequirements(item, requirements, unitsByComponent, state);
        }

        unitsByComponent.forEach((componentName, baseUnits) -> {
            if (baseUnits.size() > 1) {
                state.warn("Les unités du composant %s sont incompatibles; des lignes distinctes sont conservées."
                        .formatted(componentName));
            }
        });

        List<OrderRequirementReport.OrderRequirement> result = requirements.values().stream()
                .map(requirement -> toRequirement(requirement, state))
                .sorted(Comparator
                        .comparing(OrderRequirementReport.OrderRequirement::componentName,
                                String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(OrderRequirementReport.OrderRequirement::unit))
                .toList();
        return new OrderRequirementReport(
                order.publicId(),
                order.orderNumber(),
                Instant.now(clock),
                result,
                state.complete,
                state.warnings.stream().distinct().toList());
    }

    /**
     * Applies a valid lifecycle transition and persists the resulting aggregate.
     */
    public Order updateStatus(UUID orderId, OrderStatus status) {
        Order changed = get(orderId).changeStatus(status, Instant.now(clock));
        return repository.save(changed);
    }

    private PreparedOrder prepare(CreateOrderCommand command) {
        if (command == null || command.items().isEmpty()) {
            throw new IllegalArgumentException("La commande doit contenir au moins un item");
        }
        List<OrderItem> items = command.items().stream().map(this::createItem).toList();
        int totalCents = Order.calculateTotalCents(
                items, command.discountCents(), command.deliveryFeeCents());
        return new PreparedOrder(items, totalCents);
    }

    private OrderItem createItem(CreateOrderCommand.Item command) {
        if (command == null || command.quantity() <= 0) {
            throw new IllegalArgumentException("La quantité commandée doit être supérieure à zéro");
        }
        OrderCatalog.ProductSnapshot snapshot = catalog.snapshot(selection(command));
        int lineTotalCents;
        try {
            lineTotalCents = Math.multiplyExact(snapshot.unitPriceCents(), command.quantity());
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("Le total de ligne dépasse la limite permise", exception);
        }

        OrderCatalog.PurchaseMode mode = snapshot.purchaseMode();
        OrderCatalog.ChoiceSelection choice = snapshot.choiceSelection();
        return new OrderItem(
                null,
                UUID.randomUUID(),
                snapshot.productId(),
                snapshot.productName(),
                snapshot.productType(),
                snapshot.imageUrl(),
                command.quantity(),
                snapshot.basePriceCents(),
                snapshot.unitPriceCents(),
                lineTotalCents,
                mode.code(),
                mode.label(),
                mode.quantity(),
                mode.allocationType(),
                null,
                choice == null ? List.of() : List.of(new OrderItemChoiceSelection(
                        null, choice.code(), choice.name(), choice.groupLabel())),
                snapshot.choiceAllocations().stream()
                        .map(value -> new OrderItemChoiceAllocation(
                                null, value.code(), value.name(), value.quantity()))
                        .toList(),
                snapshot.ingredientSelections().stream()
                        .map(value -> new OrderItemIngredientSelection(
                                null, value.code(), value.name(), value.quantity(),
                                value.defaultQuantity(), value.extraPriceCents()))
                        .toList());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private OrderCatalog.ProductSelection selection(CreateOrderCommand.Item command) {
        return new OrderCatalog.ProductSelection(
                command.productId(),
                command.purchaseModeCode(),
                command.choiceCode(),
                command.allocations().stream()
                        .map(value -> new OrderCatalog.ChoiceAllocation(
                                value.choiceCode(), value.quantity()))
                        .toList(),
                command.ingredients().stream()
                        .map(value -> new OrderCatalog.IngredientSelection(
                                value.ingredientCode(), value.quantity()))
                        .toList());
    }

    private OrderCatalog.ProductSelection selection(OrderItem item) {
        String choiceCode = item.choiceSelections().isEmpty()
                ? null
                : item.choiceSelections().getFirst().choiceId();
        return new OrderCatalog.ProductSelection(
                item.productId(),
                item.purchaseModeId(),
                choiceCode,
                item.choiceAllocations().stream()
                        .map(value -> new OrderCatalog.ChoiceAllocation(
                                value.choiceId(), value.quantity()))
                        .toList(),
                item.ingredientSelections().stream()
                        .map(value -> new OrderCatalog.IngredientSelection(
                                value.ingredientId(), value.quantity()))
                        .toList());
    }

    private void addItemRequirements(
            OrderItem item,
            Map<ComponentKey, RequirementAccumulator> requirements,
            Map<String, Set<String>> unitsByComponent,
            ReportState state) {
        OrderCatalog.BomPlan plan;
        try {
            plan = catalog.bomPlan(selection(item));
        } catch (RuntimeException exception) {
            state.incomplete("%s : %s".formatted(item.productNameSnapshot(), message(exception)));
            return;
        }

        plan.warnings().forEach(warning -> state.incomplete(
                "%s : %s".formatted(item.productNameSnapshot(), warning)));
        for (OrderCatalog.ApplicableBom applicableBom : plan.boms()) {
            BigDecimal outputQuantity = applicableBom.quantity()
                    .multiply(BigDecimal.valueOf(item.quantity()));
            try {
                OrderBomRequirements.BomRequirements exploded = bomRequirements.getRequirements(
                        applicableBom.bomId(), outputQuantity);
                exploded.components().forEach(component -> addComponent(
                        requirements,
                        unitsByComponent,
                        item,
                        applicableBom.sourceName(),
                        exploded,
                        component));
            } catch (RuntimeException exception) {
                state.incomplete("%s : impossible d'exploser le BOM %s (%s)"
                        .formatted(item.productNameSnapshot(), applicableBom.bomId(), message(exception)));
            }
        }
    }

    private void addComponent(
            Map<ComponentKey, RequirementAccumulator> requirements,
            Map<String, Set<String>> unitsByComponent,
            OrderItem item,
            String configurationSource,
            OrderBomRequirements.BomRequirements exploded,
            OrderBomRequirements.ComponentRequirement component) {
        if (component.quantity() == null || component.quantity().signum() <= 0 || component.unit() == null) {
            return;
        }
        String normalizedName = component.componentName().trim().toLowerCase(Locale.ROOT);
        String baseUnit = component.unit().baseUnit();
        BigDecimal baseQuantity = component.quantity().multiply(component.unit().baseUnitFactor());
        ComponentKey key = new ComponentKey(normalizedName, baseUnit);
        requirements.computeIfAbsent(
                key,
                ignored -> new RequirementAccumulator(normalizedName, baseUnit))
                .add(
                        baseQuantity,
                        component.selectedOfferId(),
                        new SourceContribution(
                                exploded.bomId(),
                                exploded.bomName(),
                                item.publicId(),
                                item.productNameSnapshot(),
                                configurationSource,
                                baseQuantity));
        unitsByComponent.computeIfAbsent(normalizedName, ignored -> new LinkedHashSet<>()).add(baseUnit);
    }

    private OrderRequirementReport.OrderRequirement toRequirement(
            RequirementAccumulator requirement,
            ReportState state) {
        Unit displayUnit = displayUnit(requirement.baseUnit, requirement.baseQuantity);
        BigDecimal quantity = fromBase(requirement.baseQuantity, displayUnit);
        UUID selectedOfferId = requirement.selectedOfferIds.size() == 1
                ? requirement.selectedOfferIds.iterator().next()
                : null;
        if (requirement.selectedOfferIds.size() > 1) {
            state.warn("Plusieurs offres sont configurées pour %s; l'offre compatible la moins chère est affichée."
                    .formatted(requirement.componentName));
        }

        OrderRequirementReport.SourcingInformation sourcingInformation = null;
        try {
            sourcingInformation = sourcing.findCurrent(
                            requirement.componentName,
                            quantity,
                            displayUnit,
                            selectedOfferId)
                    .map(value -> new OrderRequirementReport.SourcingInformation(
                            value.supplierProductId(),
                            value.productName(),
                            value.imageUrl(),
                            value.brandOrLabel(),
                            value.supplierName(),
                            value.packageSize(),
                            value.packageUnit() == null ? null : value.packageUnit().getSymbole(),
                            value.currentPrice(),
                            value.observedAt()))
                    .orElse(null);
        } catch (RuntimeException exception) {
            state.warn("Approvisionnement indisponible pour %s : %s"
                    .formatted(requirement.componentName, message(exception)));
        }

        List<OrderRequirementReport.OrderRequirementSource> sources = requirement.sources.stream()
                .map(source -> new OrderRequirementReport.OrderRequirementSource(
                        source.bomId(),
                        source.bomName(),
                        source.orderItemId(),
                        source.productName(),
                        source.configurationSource(),
                        fromBase(source.baseQuantity(), displayUnit),
                        displayUnit.getSymbole()))
                .toList();
        return new OrderRequirementReport.OrderRequirement(
                requirement.componentName + ":" + requirement.baseUnit,
                requirement.componentName,
                quantity,
                displayUnit.getSymbole(),
                sourcingInformation,
                sources,
                null,
                null,
                null,
                null);
    }

    private Unit displayUnit(String baseUnit, BigDecimal baseQuantity) {
        if (Unit.GRAM.baseUnit().equals(baseUnit) && baseQuantity.abs().compareTo(BigDecimal.valueOf(1000)) >= 0) {
            return Unit.KILOGRAM;
        }
        if (Unit.MILLILITER.baseUnit().equals(baseUnit)
                && baseQuantity.abs().compareTo(BigDecimal.valueOf(1000)) >= 0) {
            return Unit.LITER;
        }
        return Unit.fromSymbole(baseUnit);
    }

    private BigDecimal fromBase(BigDecimal baseQuantity, Unit unit) {
        return baseQuantity.divide(unit.baseUnitFactor(), 12, RoundingMode.HALF_UP).stripTrailingZeros();
    }

    private String message(RuntimeException exception) {
        return exception.getMessage() != null ? exception.getMessage() : exception.getClass().getSimpleName();
    }

    private record ComponentKey(String componentName, String baseUnit) {
    }

    private record SourceContribution(
            UUID bomId,
            String bomName,
            UUID orderItemId,
            String productName,
            String configurationSource,
            BigDecimal baseQuantity) {
    }

    private static final class RequirementAccumulator {
        private final String componentName;
        private final String baseUnit;
        private BigDecimal baseQuantity = BigDecimal.ZERO;
        private final Set<UUID> selectedOfferIds = new LinkedHashSet<>();
        private final List<SourceContribution> sources = new ArrayList<>();

        private RequirementAccumulator(String componentName, String baseUnit) {
            this.componentName = componentName;
            this.baseUnit = baseUnit;
        }

        private void add(BigDecimal quantity, UUID selectedOfferId, SourceContribution source) {
            baseQuantity = baseQuantity.add(quantity);
            if (selectedOfferId != null) {
                selectedOfferIds.add(selectedOfferId);
            }
            sources.add(source);
        }
    }

    private static final class ReportState {
        private boolean complete = true;
        private final List<String> warnings = new ArrayList<>();

        private void incomplete(String warning) {
            complete = false;
            warnings.add(warning);
        }

        private void warn(String warning) {
            warnings.add(warning);
        }
    }

    private record PreparedOrder(List<OrderItem> items, int totalCents) {
    }

}
