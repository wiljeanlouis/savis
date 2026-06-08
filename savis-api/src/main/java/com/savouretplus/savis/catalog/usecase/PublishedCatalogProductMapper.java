package com.savouretplus.savis.catalog.usecase;

import java.math.RoundingMode;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductCategory;
import com.savouretplus.savis.catalog.domain.ProductChoiceOption;
import com.savouretplus.savis.catalog.domain.ProductIngredientOption;
import com.savouretplus.savis.catalog.domain.ProductPurchaseMode;
import com.savouretplus.savis.catalog.port.PublishedCatalogProduct;
import com.savouretplus.savis.common.Money;

@Component
public class PublishedCatalogProductMapper {

    public PublishedCatalogProduct map(Product product, ProductCategory category) {
        List<Map<String, Object>> modes = product.purchaseModes().stream()
                .filter(ProductPurchaseMode::active)
                .sorted(Comparator.comparingInt(ProductPurchaseMode::displayOrder))
                .map(this::mode)
                .toList();
        Integer dozenPrice = product.purchaseModes().stream()
                .filter(ProductPurchaseMode::active)
                .filter(mode -> "dozen".equals(mode.code()))
                .map(ProductPurchaseMode::price)
                .map(this::cents)
                .findFirst()
                .orElse(null);
        Map<String, Object> choiceGroup = product.choiceGroup() == null ? null : Map.of(
                "label", product.choiceGroup().label(),
                "required", product.choiceGroup().required(),
                "options", product.choiceGroup().options().stream()
                        .filter(ProductChoiceOption::active)
                        .sorted(Comparator.comparingInt(ProductChoiceOption::displayOrder))
                        .map(this::choice)
                        .toList());
        List<Map<String, Object>> ingredients = product.ingredientOptions().stream()
                .filter(ProductIngredientOption::active)
                .sorted(Comparator.comparingInt(ProductIngredientOption::displayOrder))
                .map(this::ingredient)
                .toList();

        return new PublishedCatalogProduct(
                product.publicId().toString(),
                product.slug(), product.name(), category.code(), product.description(),
                product.productType().name().toLowerCase(Locale.ROOT),
                modes, choiceGroup, ingredients, product.unitLabel(), cents(product.basePrice()),
                dozenPrice, product.imageUrl(), product.gallery(), product.availabilityNote(),
                product.available(), product.displayOrder());
    }

    private Map<String, Object> mode(ProductPurchaseMode mode) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("id", mode.code());
        value.put("label", mode.label());
        value.put("quantity", mode.quantity());
        value.put("price_cents", cents(mode.price()));
        value.put("allocation_type", mode.allocationType().name().toLowerCase(Locale.ROOT));
        return value;
    }

    private Map<String, Object> choice(ProductChoiceOption option) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("id", option.code());
        value.put("name", option.name());
        value.put("bom_id", option.bomId() != null ? option.bomId().toString() : null);
        return value;
    }

    private Map<String, Object> ingredient(ProductIngredientOption option) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("id", option.code());
        value.put("name", option.name());
        value.put("bom_id", option.bomId() != null ? option.bomId().toString() : null);
        value.put("default_quantity", option.defaultQuantity());
        value.put("min_quantity", option.minQuantity());
        value.put("max_quantity", option.maxQuantity());
        value.put("extra_price_cents", cents(option.extraPrice()));
        return value;
    }

    private int cents(Money money) {
        return money.amount().movePointRight(2).setScale(0, RoundingMode.HALF_UP).intValueExact();
    }
}
