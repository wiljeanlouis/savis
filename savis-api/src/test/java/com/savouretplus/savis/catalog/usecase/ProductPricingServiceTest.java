package com.savouretplus.savis.catalog.usecase;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.catalog.domain.*;
import com.savouretplus.savis.catalog.port.BomPricingPort;
import com.savouretplus.savis.common.Money;

@ExtendWith(MockitoExtension.class)
class ProductPricingServiceTest {
    @Mock BomPricingPort bomPricing;
    ProductPricingService pricing;

    @BeforeEach
    void setUp() {
        pricing = new ProductPricingService(new ProductCostService(bomPricing));
    }

    @Test
    void recommendsNextQuarterWithoutChangingCommercialPrice() {
        UUID bomId = UUID.randomUUID();
        Product product = standard(bomId, Money.of(10), new BigDecimal("0.40"));
        when(bomPricing.getPricing(bomId))
                .thenReturn(new BomPricingPort.BomPricing(Money.of(7.01), BigDecimal.ONE));

        ProductPricingAnalysis result = pricing.analyze(product, ProductConfiguration.empty());

        assertEquals(Money.of(10), result.salePrice());
        assertEquals(PriceHealthStatus.REVIEW, result.status());
        assertEquals(new BigDecimal("11.75"), result.recommendedPrice().amount());
    }

    @Test
    void reportsLossAndIncompleteBom() {
        UUID costlyBom = UUID.randomUUID();
        Product loss = standard(costlyBom, Money.of(10), new BigDecimal("0.30"));
        when(bomPricing.getPricing(costlyBom))
                .thenReturn(new BomPricingPort.BomPricing(Money.of(12), BigDecimal.ONE));
        assertEquals(PriceHealthStatus.LOSS,
                pricing.analyze(loss, ProductConfiguration.empty()).status());

        UUID missingBom = UUID.randomUUID();
        Product incomplete = standard(missingBom, Money.of(10), new BigDecimal("0.30"));
        when(bomPricing.getPricing(missingBom)).thenThrow(new RuntimeException("missing"));
        ProductPricingAnalysis result = pricing.analyze(incomplete, ProductConfiguration.empty());
        assertEquals(PriceHealthStatus.INCOMPLETE, result.status());
        assertNull(result.recommendedPrice());
        assertEquals(List.of(missingBom), result.missingBomIds());
    }

    @Test
    void sumsMultipleProductBomsWithDecimalQuantities() {
        UUID base = UUID.randomUUID();
        UUID packaging = UUID.randomUUID();
        Product product = product(
                ProductType.STANDARD,
                List.of(
                        new ProductBom(null, base, new BigDecimal("1.5"), 0),
                        new ProductBom(null, packaging, new BigDecimal("2"), 1)),
                Money.of(20),
                new BigDecimal("0.30"),
                List.of(),
                null,
                List.of());
        when(bomPricing.getPricing(base))
                .thenReturn(new BomPricingPort.BomPricing(Money.of(4), BigDecimal.ONE));
        when(bomPricing.getPricing(packaging))
                .thenReturn(new BomPricingPort.BomPricing(Money.of(0.50), BigDecimal.ONE));

        assertMoney("7.0", pricing.analyze(product, ProductConfiguration.empty()).cost());
    }

    @Test
    void pricesAndCostsOnlyIngredientExtrasAboveDefault() {
        UUID baseBom = UUID.randomUUID();
        UUID extraBom = UUID.randomUUID();
        ProductIngredientOption extra = new ProductIngredientOption(
                null, "poulet", "Poulet", extraBom, 1, 0, 3, Money.of(2), true, 0);
        Product product = product(ProductType.INGREDIENT_CUSTOMIZATION, baseBom, Money.of(8),
                new BigDecimal("0.30"), List.of(), null, List.of(extra));
        when(bomPricing.getPricing(baseBom))
                .thenReturn(new BomPricingPort.BomPricing(Money.of(3), BigDecimal.ONE));
        when(bomPricing.getPricing(extraBom))
                .thenReturn(new BomPricingPort.BomPricing(Money.of(1), BigDecimal.ONE));

        ProductPricingAnalysis removed = pricing.analyze(product,
                new ProductConfiguration(null, null, List.of(), List.of(new IngredientSelection("poulet", 0))));
        ProductPricingAnalysis doubled = pricing.analyze(product,
                new ProductConfiguration(null, null, List.of(), List.of(new IngredientSelection("poulet", 2))));

        assertEquals(Money.of(8), removed.salePrice());
        assertMoney("3", removed.cost());
        assertEquals(Money.of(10), doubled.salePrice());
        assertMoney("4", doubled.cost());
    }

    @Test
    void validatesBundleAllocationAndComputesWorstCase() {
        UUID chicken = UUID.randomUUID();
        UUID tuna = UUID.randomUUID();
        UUID packaging = UUID.randomUUID();
        ProductChoiceGroup choices = new ProductChoiceGroup(null, "Farce", true, List.of(
                new ProductChoiceOption(null, "chicken", "Poulet", chicken, true, 0),
                new ProductChoiceOption(null, "tuna", "Thon", tuna, true, 1)));
        ProductPurchaseMode dozen = new ProductPurchaseMode(
                null, "dozen", "Douzaine", 12, Money.of(30),
                AllocationType.CHOICE_ALLOCATION, true, 0);
        Product product = product(
                ProductType.SINGLE_CHOICE_BUNDLE,
                List.of(new ProductBom(null, packaging, BigDecimal.ONE, 0)),
                Money.of(3),
                new BigDecimal("0.30"), List.of(dozen), choices, List.of());
        when(bomPricing.getPricing(packaging))
                .thenReturn(new BomPricingPort.BomPricing(Money.of(3), BigDecimal.ONE));
        when(bomPricing.getPricing(chicken))
                .thenReturn(new BomPricingPort.BomPricing(Money.of(1), BigDecimal.ONE));
        when(bomPricing.getPricing(tuna))
                .thenReturn(new BomPricingPort.BomPricing(Money.of(2), BigDecimal.ONE));

        ProductConfiguration split = new ProductConfiguration("dozen", null,
                List.of(new ChoiceAllocation("chicken", 6), new ChoiceAllocation("tuna", 6)), List.of());
        assertMoney("21", pricing.analyze(product, split).cost());
        assertMoney("27", pricing.analyzeWorstCase(product, "dozen").cost());
        assertThrows(IllegalArgumentException.class, () -> pricing.analyze(product,
                new ProductConfiguration("dozen", null,
                        List.of(new ChoiceAllocation("chicken", 11)), List.of())));
    }

    @Test
    void singleChoiceAddsCommonBomsAndChoiceCostByPurchaseModeQuantity() {
        UUID common = UUID.randomUUID();
        UUID choiceBom = UUID.randomUUID();
        ProductChoiceGroup choices = new ProductChoiceGroup(null, "Farce", true, List.of(
                new ProductChoiceOption(null, "chicken", "Poulet", choiceBom, true, 0)));
        ProductPurchaseMode dozen = new ProductPurchaseMode(
                null, "dozen", "Douzaine", 12, Money.of(30),
                AllocationType.SINGLE_CHOICE, true, 0);
        Product product = product(
                ProductType.SINGLE_CHOICE,
                List.of(new ProductBom(null, common, BigDecimal.ONE, 0)),
                Money.of(3),
                new BigDecimal("0.30"),
                List.of(dozen),
                choices,
                List.of());
        when(bomPricing.getPricing(common))
                .thenReturn(new BomPricingPort.BomPricing(Money.of(2), BigDecimal.ONE));
        when(bomPricing.getPricing(choiceBom))
                .thenReturn(new BomPricingPort.BomPricing(Money.of(1), BigDecimal.ONE));

        ProductConfiguration configuration = new ProductConfiguration("dozen", "chicken", List.of(), List.of());

        assertMoney("14", pricing.analyze(product, configuration).cost());
    }

    @Test
    void missingChoiceBomMakesAnalysisIncompleteWithoutBlockingProduct() {
        UUID common = UUID.randomUUID();
        ProductChoiceGroup choices = new ProductChoiceGroup(null, "Farce", true, List.of(
                new ProductChoiceOption(null, "chicken", "Poulet", null, true, 0)));
        Product product = product(
                ProductType.SINGLE_CHOICE,
                List.of(new ProductBom(null, common, BigDecimal.ONE, 0)),
                Money.of(3),
                new BigDecimal("0.30"),
                List.of(),
                choices,
                List.of());
        when(bomPricing.getPricing(common))
                .thenReturn(new BomPricingPort.BomPricing(Money.of(2), BigDecimal.ONE));

        ProductPricingAnalysis result = pricing.analyze(
                product, new ProductConfiguration(null, "chicken", List.of(), List.of()));

        assertEquals(PriceHealthStatus.INCOMPLETE, result.status());
        assertMoney("2", result.cost());
    }

    @Test
    void missingIngredientBomMakesDefaultConfigurationIncomplete() {
        UUID common = UUID.randomUUID();
        ProductIngredientOption extra = new ProductIngredientOption(
                null, "egg", "Oeuf", null, 1, 0, 3, Money.of(1), true, 0);
        Product product = product(
                ProductType.INGREDIENT_CUSTOMIZATION,
                List.of(new ProductBom(null, common, BigDecimal.ONE, 0)),
                Money.of(8),
                new BigDecimal("0.30"),
                List.of(),
                null,
                List.of(extra));
        when(bomPricing.getPricing(common))
                .thenReturn(new BomPricingPort.BomPricing(Money.of(3), BigDecimal.ONE));

        ProductPricingAnalysis result = pricing.analyze(product, ProductConfiguration.empty());

        assertEquals(PriceHealthStatus.INCOMPLETE, result.status());
        assertMoney("3", result.cost());
    }

    private Product standard(UUID bomId, Money price, BigDecimal margin) {
        return product(ProductType.STANDARD, bomId, price, margin, List.of(), null, List.of());
    }

    private void assertMoney(String expected, Money actual) {
        assertEquals("CAD", actual.currency());
        assertEquals(0, new BigDecimal(expected).compareTo(actual.amount()));
    }

    private Product product(ProductType type, UUID bomId, Money price, BigDecimal margin,
            List<ProductPurchaseMode> modes, ProductChoiceGroup group,
            List<ProductIngredientOption> ingredients) {
        return product(
                type,
                List.of(new ProductBom(null, bomId, BigDecimal.ONE, 0)),
                price,
                margin,
                modes,
                group,
                ingredients);
    }

    private Product product(ProductType type, List<ProductBom> productBoms, Money price, BigDecimal margin,
            List<ProductPurchaseMode> modes, ProductChoiceGroup group,
            List<ProductIngredientOption> ingredients) {
        List<ProductPurchaseMode> safeModes = modes.isEmpty()
                ? List.of(new ProductPurchaseMode(
                        null, "unit", "À l'unité", 1, price, AllocationType.NONE, true, 0))
                : modes;
        return new Product(null, "code", "slug", "Produit", "", type, ProductCategory.TASTING, productBoms,
                margin, "/image.jpg", List.of(), "Disponible", true, true,
                0, safeModes, group, ingredients);
    }
}
