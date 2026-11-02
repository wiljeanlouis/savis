package com.savouretplus.savis.sales.quotation.adapter.supabase;

import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequest;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequestQualification.*;
import com.savouretplus.savis.sales.quotation.port.QuoteRequestSelections;

@Component
public class QuoteRequestSelectionMapper implements QuoteRequestSelections {
    private final JsonMapper json = JsonMapper.builder().build();

    @Override
    public List<Selection> read(QuoteRequest request) {
        var result = new ArrayList<Selection>();
        var items = json.readTree(request.originalPayload()).path("items");
        for (int index = 0; index < items.size(); index++) {
            var item = items.path(index);
            String key = "item:" + index;
            UUID productId = null;
            Line line = null;
            String issue = null;
            try {
                productId = UUID.fromString(required(item, "offering_id"));
                var config = item.path("configuration");
                if (!config.isObject()) throw new IllegalArgumentException();
                for (String field : List.of("allocation", "ingredients")) {
                    if (config.has(field) && (!config.path(field).isArray() || config.path(field).size() > 100))
                        throw new IllegalArgumentException();
                }
                var allocations = new ArrayList<Allocation>();
                for (JsonNode value : config.path("allocation"))
                    allocations.add(new Allocation(required(value, "choice_id"), quantity(value)));
                var ingredients = new ArrayList<Ingredient>();
                for (JsonNode value : config.path("ingredients"))
                    ingredients.add(new Ingredient(required(value, "id"), quantity(value)));
                line = new Line(UUID.nameUUIDFromBytes((request.publicId() + ":" + key).getBytes(StandardCharsets.UTF_8)),
                        productId, positiveQuantity(item),
                        optional(config.path("purchase_mode"), "id"), optional(config.path("selection"), "choice_id"),
                        allocations, ingredients, Set.of(key));
            } catch (IllegalArgumentException error) {
                issue = "La référence ou la configuration transmise doit être corrigée";
            }
            result.add(new Selection(key, item.path("name").asText(), productId, line, issue));
        }
        return List.copyOf(result);
    }

    private static String optional(JsonNode node, String field) {
        if (node.isMissingNode() || node.isNull()) return null;
        return required(node, field);
    }
    private static String required(JsonNode node, String field) {
        var value = node.path(field);
        if (!value.isTextual() || value.asText().isBlank()) throw new IllegalArgumentException();
        return value.asText();
    }
    private static int positiveQuantity(JsonNode item) {
        var value = item.path("requested_quantity");
        if (!value.isIntegralNumber() || !value.canConvertToInt()) throw new IllegalArgumentException();
        return value.asInt();
    }
    private static int quantity(JsonNode node) {
        var value = node.path("quantity");
        if (!value.isIntegralNumber() || !value.canConvertToInt() || value.asInt() < 0 || value.asInt() > 1000)
            throw new IllegalArgumentException();
        return value.asInt();
    }
}
