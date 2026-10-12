package com.savouretplus.savis.order.adapter.supabase;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.order.domain.OrderAddress;
import com.savouretplus.savis.order.port.PendingCustomerOrder;

/**
 * Maps Supabase PostgREST payloads into the provider-neutral import contract.
 */
@Component
class SupabaseCustomerOrderMapper {

    /**
     * Converts one PostgREST response into a typed pending customer order.
     */
    PendingCustomerOrder map(SupabaseCustomerOrderResponse source) {
        if (source == null || source.id() == null) {
            throw new IllegalArgumentException("La commande Supabase et son identifiant sont requis");
        }

        List<PendingCustomerOrder.Item> items = source.items() == null
                ? List.of()
                : source.items().stream().map(this::mapItem).toList();

        return new PendingCustomerOrder(
                source.id(),
                source.customer_name(),
                source.customer_phone(),
                source.customer_email(),
                address(source.customer_address()),
                source.note(),
                source.status(),
                source.source(),
                valueOrZero(source.discount_cents()),
                valueOrZero(source.delivery_fee_cents()),
                source.total_cents(),
                items,
                source.created_at(),
                rawPayload(source));
    }

    private PendingCustomerOrder.Item mapItem(Map<String, Object> item) {
        if (item == null) {
            throw new IllegalArgumentException("Un item Supabase ne peut pas être nul");
        }

        Map<String, Object> purchaseMode = optionalObject(item, "purchase_mode");
        Map<String, Object> selection = optionalObject(item, "selection");

        List<PendingCustomerOrder.ChoiceAllocation> allocations = new ArrayList<>();
        for (Map<String, Object> allocation : objectList(item, "allocation")) {
            allocations.add(new PendingCustomerOrder.ChoiceAllocation(
                    requiredText(allocation, "choice_id"),
                    requiredText(allocation, "choice_name"),
                    nonNegativeInt(allocation, "quantity")));
        }

        List<PendingCustomerOrder.IngredientSelection> ingredients = new ArrayList<>();
        for (Map<String, Object> ingredient : objectList(item, "ingredients")) {
            ingredients.add(new PendingCustomerOrder.IngredientSelection(
                    requiredText(ingredient, "id"),
                    requiredText(ingredient, "name"),
                    nonNegativeInt(ingredient, "quantity"),
                    ingredient.get("default_quantity") != null
                            ? nonNegativeInt(ingredient, "default_quantity")
                            : 0,
                    nonNegativeInt(ingredient, "extra_price_cents")));
        }

        return new PendingCustomerOrder.Item(
                uuid(item, "product_id"),
                requiredText(item, "name"),
                requiredText(item, "product_type"),
                optionalText(item, "image_url"),
                positiveInt(item, "quantity"),
                item.get("base_price_cents") != null ? nonNegativeInt(item, "base_price_cents") : null,
                nonNegativeInt(item, "unit_price_cents"),
                purchaseMode == null ? null : new PendingCustomerOrder.PurchaseMode(
                        requiredText(purchaseMode, "id"),
                        requiredText(purchaseMode, "label"),
                        positiveInt(purchaseMode, "quantity"),
                        requiredText(purchaseMode, "allocation_type")),
                selection == null ? null : new PendingCustomerOrder.ChoiceSelection(
                        requiredText(selection, "choice_id"),
                        requiredText(selection, "choice_name"),
                        requiredText(selection, "group_label")),
                allocations,
                ingredients,
                optionalText(item, "key"));
    }

    private Map<String, Object> rawPayload(SupabaseCustomerOrderResponse source) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", source.id().toString());
        payload.put("customer_name", source.customer_name());
        payload.put("customer_phone", source.customer_phone());
        payload.put("customer_email", source.customer_email());
        payload.put("customer_address", source.customer_address());
        payload.put("note", source.note());
        payload.put("status", source.status());
        payload.put("source", source.source());
        payload.put("discount_cents", valueOrZero(source.discount_cents()));
        payload.put("delivery_fee_cents", valueOrZero(source.delivery_fee_cents()));
        payload.put("total_cents", source.total_cents());
        payload.put("items", source.items());
        payload.put("created_at", instantValue(source.created_at()));
        payload.put("sync_status", source.sync_status());
        payload.put("synced_at", instantValue(source.synced_at()));
        payload.put("sync_error", source.sync_error());
        payload.put("notified_at", instantValue(source.notified_at()));
        return payload;
    }

    private OrderAddress address(Map<String, String> source) {
        if (source == null) {
            return null;
        }
        OrderAddress address = new OrderAddress(
                source.get("line1"),
                source.get("line2"),
                source.get("city"),
                source.get("province"),
                source.get("postal_code"));
        return address.isEmpty() ? null : address;
    }

    private int valueOrZero(Integer value) {
        return value == null ? 0 : value;
    }

    private String instantValue(Instant value) {
        return value != null ? value.toString() : null;
    }

    private UUID uuid(Map<String, Object> source, String field) {
        String value = requiredText(source, field);
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Le champ %s doit être un UUID valide".formatted(field), exception);
        }
    }

    private String requiredText(Map<String, Object> source, String field) {
        String value = optionalText(source, field);
        if (value == null) {
            throw new IllegalArgumentException("Le champ %s est requis dans un item".formatted(field));
        }
        return value;
    }

    private String optionalText(Map<String, Object> source, String field) {
        Object value = source.get(field);
        return value instanceof String text && !text.isBlank() ? text : null;
    }

    private int positiveInt(Map<String, Object> source, String field) {
        int value = nonNegativeInt(source, field);
        if (value == 0) {
            throw new IllegalArgumentException("Le champ %s doit être supérieur à zéro".formatted(field));
        }
        return value;
    }

    private int nonNegativeInt(Map<String, Object> source, String field) {
        Object value = source.get(field);
        if (!(value instanceof Number number)) {
            throw new IllegalArgumentException("Le champ %s doit être un entier positif ou nul".formatted(field));
        }
        long longValue = number.longValue();
        if (longValue < 0 || longValue > Integer.MAX_VALUE || number.doubleValue() != longValue) {
            throw new IllegalArgumentException("Le champ %s doit être un entier positif ou nul".formatted(field));
        }
        return (int) longValue;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> optionalObject(Map<String, Object> source, String field) {
        Object value = source.get(field);
        if (value == null) {
            return null;
        }
        if (!(value instanceof Map<?, ?>)) {
            throw new IllegalArgumentException("Le champ %s doit être un objet".formatted(field));
        }
        return (Map<String, Object>) value;
    }

    private List<Map<String, Object>> objectList(Map<String, Object> source, String field) {
        Object value = source.get(field);
        if (value == null) {
            return List.of();
        }
        if (!(value instanceof List<?> values)) {
            throw new IllegalArgumentException("Le champ %s doit être un tableau".formatted(field));
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object element : values) {
            if (!(element instanceof Map<?, ?> map)) {
                throw new IllegalArgumentException("Le champ %s doit contenir des objets".formatted(field));
            }
            Map<String, Object> typed = new LinkedHashMap<>();
            map.forEach((key, entryValue) -> {
                if (!(key instanceof String stringKey)) {
                    throw new IllegalArgumentException("Le champ %s contient une clé invalide".formatted(field));
                }
                typed.put(stringKey, entryValue);
            });
            result.add(typed);
        }
        return result;
    }
}
