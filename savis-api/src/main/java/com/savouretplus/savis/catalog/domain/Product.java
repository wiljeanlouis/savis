package com.savouretplus.savis.catalog.domain;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.Optional;

import com.savouretplus.savis.common.Money;

/**
 * Represents a sellable catalog product and its pricing configuration.
 */
public record Product(
        UUID publicId,
        String code,
        String slug,
        String name,
        String description,
        ProductType productType,
        ProductCategory category,
        List<ProductBom> productBoms,
        BigDecimal targetMarginRate,
        String imageUrl,
        List<String> gallery,
        String availabilityNote,
        boolean available,
        boolean published,
        int displayOrder,
        List<ProductPurchaseMode> purchaseModes,
        ProductChoiceGroup choiceGroup,
        List<ProductIngredientOption> ingredientOptions) {

    /**
     * Validates a catalog product and normalizes optional collections and defaults.
     */
    public Product {
        publicId = publicId != null ? publicId : UUID.randomUUID();
        requireText(code, "Le code du produit est requis");
        requireText(slug, "Le slug du produit est requis");
        requireText(name, "Le nom du produit est requis");
        description = description != null ? description : "";
        productType = productType != null ? productType : ProductType.STANDARD;
        if (category == null) {
            throw new IllegalArgumentException("La catégorie du produit est requise");
        }
        if (targetMarginRate == null
                || targetMarginRate.compareTo(BigDecimal.ZERO) < 0
                || targetMarginRate.compareTo(BigDecimal.ONE) >= 0) {
            throw new IllegalArgumentException("La marge cible doit être comprise entre 0 inclus et 1 exclu");
        }
        requireText(imageUrl, "L'image principale du produit est requise");
        gallery = gallery != null ? List.copyOf(gallery) : List.of();
        availabilityNote = isBlank(availabilityNote) ? "Disponible sur commande" : availabilityNote;
        if (displayOrder < 0) {
            throw new IllegalArgumentException("L'ordre d'affichage ne peut pas être négatif");
        }
        productBoms = productBoms != null ? List.copyOf(productBoms) : List.of();
        purchaseModes = purchaseModes != null ? List.copyOf(purchaseModes) : List.of();
        ingredientOptions = ingredientOptions != null ? List.copyOf(ingredientOptions) : List.of();
        if (purchaseModes.stream().noneMatch(ProductPurchaseMode::active)) {
            throw new IllegalArgumentException("Au moins un mode d'achat actif est requis");
        }
        requireUniqueCodes(purchaseModes.stream().map(ProductPurchaseMode::code).toList(), "mode d'achat");
        requireUniqueCodes(ingredientOptions.stream().map(ProductIngredientOption::code).toList(), "ingrédient");
        validateStructure(productType, choiceGroup, ingredientOptions);
    }

    /**
     * Calculates the sale price for a product configuration.
     */
    public Money calculateSalePrice(ProductConfiguration configuration) {
        ProductConfiguration safeConfiguration = configuration != null ? configuration : ProductConfiguration.empty();
        Money price = selectedMode(safeConfiguration).price();

        validateChoices(safeConfiguration);
        validateIngredients(safeConfiguration);

        if (productType != ProductType.INGREDIENT_CUSTOMIZATION) {
            return price;
        }

        for (ProductIngredientOption ingredient : ingredientOptions.stream()
                .filter(ProductIngredientOption::active)
                .toList()) {
            int selectedQuantity = safeConfiguration.ingredients().stream()
                    .filter(selection -> selection.ingredientCode().equals(ingredient.code()))
                    .mapToInt(IngredientSelection::quantity)
                    .findFirst()
                    .orElse(ingredient.defaultQuantity());
            price = price.add(ingredient.extraPrice().multiply(ingredient.extraQuantity(selectedQuantity)));
        }
        return price;
    }

    /**
     * Returns an active purchase mode by code or fails when it is unavailable.
     */
    public ProductPurchaseMode requireActiveMode(String code) {
        return findActiveMode(code)
                .orElseThrow(() -> new IllegalArgumentException("Mode d'achat actif introuvable: " + code));
    }

    /**
     * Returns the active purchase mode selected by a configuration, or the default active mode.
     */
    public ProductPurchaseMode selectedMode(ProductConfiguration configuration) {
        ProductConfiguration safeConfiguration = configuration != null ? configuration : ProductConfiguration.empty();
        if (!isBlank(safeConfiguration.purchaseModeCode())) {
            return requireActiveMode(safeConfiguration.purchaseModeCode());
        }
        return defaultActiveMode();
    }

    /**
     * Returns an active choice option by code or fails when it is unavailable.
     */
    public ProductChoiceOption requireActiveChoice(String code) {
        if (choiceGroup == null) {
            throw new IllegalArgumentException("Ce produit ne possède pas de groupe de choix");
        }
        return choiceGroup.activeOption(code);
    }

    /**
     * Returns an active ingredient option by code or fails when it is unavailable.
     */
    public ProductIngredientOption requireActiveIngredient(String code) {
        return ingredientOptions.stream()
                .filter(ProductIngredientOption::active)
                .filter(option -> option.code().equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Ingrédient actif introuvable: " + code));
    }

    /**
     * Validates that a product configuration only references active options and quantities.
     */
    public void validateConfiguration(ProductConfiguration configuration) {
        ProductConfiguration safeConfiguration = configuration != null ? configuration : ProductConfiguration.empty();
        validateChoices(safeConfiguration);
        validateIngredients(safeConfiguration);
    }

    /**
     * Returns a copy of this product with replacement purchase modes.
     */
    public Product withPurchaseModes(List<ProductPurchaseMode> modes) {
        return copy(modes, choiceGroup, ingredientOptions);
    }

    /**
     * Returns a copy of this product with a replacement choice group.
     */
    public Product withChoiceGroup(ProductChoiceGroup group) {
        return copy(purchaseModes, group, ingredientOptions);
    }

    /**
     * Returns a copy of this product with replacement ingredient options.
     */
    public Product withIngredientOptions(List<ProductIngredientOption> ingredients) {
        return copy(purchaseModes, choiceGroup, ingredients);
    }

    /**
     * Returns a copy of this product with a replacement publication flag.
     */
    public Product withPublished(boolean value) {
        return new Product(
                publicId, code, slug, name, description, productType, category, productBoms,
                targetMarginRate, imageUrl, gallery, availabilityNote,
                available, value, displayOrder, purchaseModes, choiceGroup, ingredientOptions);
    }

    private Product copy(
            List<ProductPurchaseMode> modes,
            ProductChoiceGroup group,
            List<ProductIngredientOption> ingredients) {
        return new Product(
                publicId, code, slug, name, description, productType, category, productBoms,
                targetMarginRate, imageUrl, gallery, availabilityNote,
                available, published, displayOrder, modes, group, ingredients);
    }

    private Optional<ProductPurchaseMode> findActiveMode(String code) {
        if (code == null || code.isBlank()) {
            return java.util.Optional.empty();
        }
        return purchaseModes.stream()
                .filter(ProductPurchaseMode::active)
                .filter(mode -> mode.code().equals(code))
                .findFirst();
    }

    private ProductPurchaseMode defaultActiveMode() {
        return purchaseModes.stream()
                .filter(ProductPurchaseMode::active)
                .min(Comparator.comparingInt(ProductPurchaseMode::displayOrder)
                        .thenComparing(ProductPurchaseMode::label)
                        .thenComparing(ProductPurchaseMode::code))
                .orElseThrow(() -> new IllegalStateException("Au moins un mode d'achat actif est requis"));
    }

    private void validateChoices(ProductConfiguration configuration) {
        if (productType != ProductType.SINGLE_CHOICE
                && productType != ProductType.SINGLE_CHOICE_BUNDLE) {
            return;
        }
        if (choiceGroup == null) {
            throw new IllegalStateException("Le groupe de choix est requis pour ce type de produit");
        }

        ProductPurchaseMode mode = configuration.purchaseModeCode() != null
                ? requireActiveMode(configuration.purchaseModeCode())
                : null;
        AllocationType allocationType = mode != null ? mode.allocationType() : AllocationType.SINGLE_CHOICE;

        if (allocationType == AllocationType.CHOICE_ALLOCATION) {
            int allocatedQuantity = configuration.allocations().stream()
                    .peek(allocation -> requireActiveChoice(allocation.choiceCode()))
                    .mapToInt(ChoiceAllocation::quantity)
                    .sum();
            if (mode != null && allocatedQuantity != mode.quantity()) {
                throw new IllegalArgumentException(
                        "La somme des choix doit être égale à " + mode.quantity());
            }
            return;
        }

        if (choiceGroup.required() && isBlank(configuration.choiceCode())) {
            throw new IllegalArgumentException("Un choix est requis");
        }
        if (!isBlank(configuration.choiceCode())) {
            requireActiveChoice(configuration.choiceCode());
        }
    }

    private void validateIngredients(ProductConfiguration configuration) {
        if (productType != ProductType.INGREDIENT_CUSTOMIZATION) {
            if (!configuration.ingredients().isEmpty()) {
                throw new IllegalArgumentException("Ce produit ne permet pas de personnaliser les ingrédients");
            }
            return;
        }
        configuration.ingredients().forEach(selection -> requireActiveIngredient(selection.ingredientCode())
                .validateQuantity(selection.quantity()));
    }

    private static void validateStructure(
            ProductType type,
            ProductChoiceGroup choiceGroup,
            List<ProductIngredientOption> ingredients) {
        if ((type == ProductType.SINGLE_CHOICE || type == ProductType.SINGLE_CHOICE_BUNDLE)
                && choiceGroup == null) {
            throw new IllegalArgumentException("Un groupe de choix est requis pour ce type de produit");
        }
        if (type == ProductType.INGREDIENT_CUSTOMIZATION && ingredients.isEmpty()) {
            throw new IllegalArgumentException("Au moins un ingrédient personnalisable est requis");
        }
    }

    static void requireUniqueCodes(List<String> codes, String label) {
        Set<String> seen = new HashSet<>();
        codes.stream()
                .filter(Objects::nonNull)
                .forEach(code -> {
                    if (!seen.add(code)) {
                        throw new IllegalArgumentException("Code de %s dupliqué: %s".formatted(label, code));
                    }
                });
    }

    private static void requireText(String value, String message) {
        if (isBlank(value)) {
            throw new IllegalArgumentException(message);
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
