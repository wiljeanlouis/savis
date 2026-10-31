package com.savouretplus.savis.sales.quotation.usecase;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.catalog.api.CatalogOrderingApi;
import com.savouretplus.savis.sales.order.api.QuotationOrderApi;
import com.savouretplus.savis.sales.quotation.domain.Quotation;
import com.savouretplus.savis.sales.quotation.domain.QuotationAddress;
import com.savouretplus.savis.sales.quotation.domain.QuotationContactNormalizer;
import com.savouretplus.savis.sales.quotation.domain.QuotationItem;
import com.savouretplus.savis.sales.quotation.domain.QuotationStatus;
import com.savouretplus.savis.sales.quotation.port.QuotationNumberGenerator;
import com.savouretplus.savis.sales.quotation.port.QuotationRepository;

import lombok.AllArgsConstructor;

/** Coordinates quotation snapshots, lifecycle transitions and order conversion. */
@Service
@AllArgsConstructor
public class QuotationService {
    private final QuotationRepository quotations;
    private final QuotationNumberGenerator numbers;
    private final CatalogOrderingApi catalog;
    private final QuotationOrderApi orders;
    private final Clock clock;

    /** Creates a draft from current catalog prices and configuration labels. */
    @Transactional
    public Quotation create(SaveQuotationCommand command) {
        Instant now = clock.instant();
        return quotations.save(build(null, null, numbers.next(), now, command));
    }

    /** Replaces editable values and snapshots while the quotation remains a draft. */
    @Transactional
    public Quotation update(UUID quotationId, SaveQuotationCommand command) {
        Quotation current = requireForUpdate(quotationId);
        if (current.status() != QuotationStatus.DRAFT) {
            throw new IllegalStateException("Seule une soumission brouillon peut être modifiée");
        }
        return quotations.save(build(current.id(), current.publicId(), current.quotationNumber(),
                current.createdAt(), command));
    }

    /** Returns one quotation. */
    @Transactional(readOnly = true)
    public Quotation get(UUID quotationId) {
        return require(quotationId);
    }

    /** Lists quotations from newest to oldest. */
    @Transactional(readOnly = true)
    public List<Quotation> list() {
        return quotations.findAll();
    }

    /** Applies an allowed lifecycle transition. */
    @Transactional
    public Quotation changeStatus(UUID quotationId, QuotationStatus status) {
        return quotations.save(requireForUpdate(quotationId).changeStatus(status, clock.instant()));
    }

    /** Converts an accepted quotation exactly once while preserving every snapshot price. */
    @Transactional
    public UUID convert(UUID quotationId) {
        Quotation quotation = quotations.findByPublicIdForUpdate(quotationId)
                .orElseThrow(() -> new QuotationNotFoundException(quotationId));
        if (quotation.convertedOrderId() != null) {
            return quotation.convertedOrderId();
        }
        if (quotation.status() != QuotationStatus.ACCEPTED) {
            throw new IllegalStateException("Seule une soumission acceptée peut être convertie");
        }
        UUID orderId = orders.create(toOrder(quotation));
        quotations.save(quotation.convertedTo(orderId, clock.instant()));
        return orderId;
    }

    private Quotation build(
            Long id, UUID publicId, String number, Instant createdAt, SaveQuotationCommand command) {
        if (command == null || command.validUntil() == null) {
            throw new IllegalArgumentException("La date de validité est requise");
        }
        List<QuotationItem> items = command.items().stream().map(this::snapshot).toList();
        if (items.isEmpty()) {
            throw new IllegalArgumentException("Ajoutez au moins un produit à la soumission");
        }
        int total = Quotation.calculateTotalCents(
                items, command.discountCents(), command.deliveryFeeCents());
        Instant now = clock.instant();
        return new Quotation(
                id, publicId, number, QuotationStatus.DRAFT,
                command.customerName(), QuotationContactNormalizer.phone(command.customerPhone()),
                blank(command.customerEmail()), QuotationContactNormalizer.address(command.customerAddress()),
                command.validUntil(), blank(command.note()), command.discountCents(), command.deliveryFeeCents(),
                total,
                createdAt, now, null, null, null, null, items);
    }

    private QuotationItem snapshot(SaveQuotationCommand.Item item) {
        if (item.quantity() <= 0) {
            throw new IllegalArgumentException("La quantité doit être supérieure à zéro");
        }
        CatalogOrderingApi.ProductSnapshot product = catalog.snapshot(selection(item));
        int lineTotal;
        try {
            lineTotal = Math.multiplyExact(product.unitPriceCents(), item.quantity());
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException(
                    "Le total de la ligne de soumission dépasse la limite permise", exception);
        }
        return new QuotationItem(
                null, product.productId(), product.productName(), product.commercialType(), product.productType(),
                product.imageUrl(), item.quantity(), product.basePriceCents(), product.unitPriceCents(), lineTotal,
                product.purchaseMode().code(), product.purchaseMode().label(), product.purchaseMode().quantity(),
                product.purchaseMode().allocationType(),
                product.choiceSelection() == null ? List.of() : List.of(new QuotationItem.Choice(
                        product.choiceSelection().code(), product.choiceSelection().name(),
                        product.choiceSelection().groupLabel())),
                product.choiceAllocations().stream().map(value -> new QuotationItem.Allocation(
                        value.code(), value.name(), value.quantity())).toList(),
                product.ingredientSelections().stream().map(value -> new QuotationItem.Ingredient(
                        value.code(), value.name(), value.quantity(), value.defaultQuantity(),
                        value.extraPriceCents())).toList());
    }

    private CatalogOrderingApi.ProductSelection selection(SaveQuotationCommand.Item item) {
        return new CatalogOrderingApi.ProductSelection(
                item.productId(), item.purchaseModeCode(), item.choiceCode(),
                item.allocations().stream().map(value -> new CatalogOrderingApi.ChoiceAllocation(
                        value.choiceCode(), value.quantity())).toList(),
                item.ingredients().stream().map(value -> new CatalogOrderingApi.IngredientSelection(
                        value.ingredientCode(), value.quantity())).toList());
    }

    private QuotationOrderApi.QuotationSnapshot toOrder(Quotation quotation) {
        QuotationAddress address = quotation.customerAddress();
        return new QuotationOrderApi.QuotationSnapshot(
                quotation.publicId(), quotation.customerName(), quotation.customerPhone(), quotation.customerEmail(),
                address == null ? null : new QuotationOrderApi.Address(
                        address.line1(), address.line2(), address.city(), address.province(), address.postalCode()),
                quotation.note(), quotation.discountCents(), quotation.deliveryFeeCents(), quotation.totalCents(),
                quotation.items().stream().map(this::toOrderItem).toList());
    }

    private QuotationOrderApi.Item toOrderItem(QuotationItem item) {
        return new QuotationOrderApi.Item(
                item.productId(), item.productName(), item.productType(), item.imageUrl(), item.quantity(),
                item.basePriceCents(), item.unitPriceCents(), item.lineTotalCents(), item.purchaseModeId(),
                item.purchaseModeLabel(), item.purchaseModeQuantity(), item.allocationType(),
                item.choices().stream().map(value -> new QuotationOrderApi.Choice(
                        value.id(), value.name(), value.groupLabel())).toList(),
                item.allocations().stream().map(value -> new QuotationOrderApi.Allocation(
                        value.id(), value.name(), value.quantity())).toList(),
                item.ingredients().stream().map(value -> new QuotationOrderApi.Ingredient(
                        value.id(), value.name(), value.quantity(), value.defaultQuantity(),
                        value.extraPriceCents())).toList());
    }

    private Quotation require(UUID id) {
        return quotations.findByPublicId(id).orElseThrow(() -> new QuotationNotFoundException(id));
    }

    private Quotation requireForUpdate(UUID id) {
        return quotations.findByPublicIdForUpdate(id)
                .orElseThrow(() -> new QuotationNotFoundException(id));
    }

    private String blank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
