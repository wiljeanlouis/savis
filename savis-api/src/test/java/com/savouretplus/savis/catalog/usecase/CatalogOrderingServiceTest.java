package com.savouretplus.savis.catalog.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.catalog.api.CatalogOrderingApi;
import com.savouretplus.savis.catalog.domain.AllocationType;
import com.savouretplus.savis.catalog.domain.CommercialType;
import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductBom;
import com.savouretplus.savis.catalog.domain.ProductCategory;
import com.savouretplus.savis.catalog.domain.ProductChoiceGroup;
import com.savouretplus.savis.catalog.domain.ProductChoiceOption;
import com.savouretplus.savis.catalog.domain.ProductIngredientOption;
import com.savouretplus.savis.catalog.domain.ProductPurchaseMode;
import com.savouretplus.savis.catalog.domain.ProductType;
import com.savouretplus.savis.common.Money;

@ExtendWith(MockitoExtension.class)
class CatalogOrderingServiceTest {
    private static final UUID PRODUCT_ID = UUID.fromString("20000000-0000-4000-8000-000000000002");

    @Mock ProductService products;

    @Test
    void validatesConfigurationAndReturnsAuthoritativePriceSnapshots() {
        Product product = new Product(
                PRODUCT_ID,
                "COOKIE",
                "cookie",
                "Biscuit personnalisé",
                "",
                CommercialType.GOODS,
                ProductType.INGREDIENT_CUSTOMIZATION,
                ProductCategory.TASTING,
                null,
                List.of(),
                new BigDecimal("0.30"),
                "/cookie.jpg",
                List.of(),
                "Disponible",
                true,
                true,
                0,
                List.of(new ProductPurchaseMode(
                        null, "unit", "Unité", 1, Money.of(8), AllocationType.NONE, true, 0)),
                null,
                List.of(new ProductIngredientOption(
                        null, "sprinkles", "Confettis", null,
                        1, 0, 3, Money.of(1.5), true, 0)));
        when(products.get(PRODUCT_ID)).thenReturn(product);
        CatalogOrderingService service = new CatalogOrderingService(products);

        CatalogOrderingApi.ProductSnapshot snapshot = service.snapshot(
                new CatalogOrderingApi.ProductSelection(
                        PRODUCT_ID,
                        "unit",
                        null,
                        List.of(),
                        List.of(new CatalogOrderingApi.IngredientSelection("sprinkles", 2))));

        assertEquals(800, snapshot.basePriceCents());
        assertEquals(950, snapshot.unitPriceCents());
        assertEquals("INGREDIENT_CUSTOMIZATION", snapshot.productType());
        assertEquals(2, snapshot.ingredientSelections().getFirst().quantity());
        assertEquals(150, snapshot.ingredientSelections().getFirst().extraPriceCents());
    }

    @Test
    void exposesAMissingProductAsAnInvalidOrderSelection() {
        when(products.get(PRODUCT_ID)).thenThrow(new ProductNotFoundException(PRODUCT_ID));
        CatalogOrderingService service = new CatalogOrderingService(products);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.snapshot(new CatalogOrderingApi.ProductSelection(
                        PRODUCT_ID, "unit", null, List.of(), List.of())));

        assertEquals("Produit introuvable: " + PRODUCT_ID, exception.getMessage());
    }

    @Test
    void resolvesCommonAndExtraBomsFromTheOrderedConfiguration() {
        UUID commonBomId = UUID.randomUUID();
        UUID extraBomId = UUID.randomUUID();
        Product product = new Product(
                PRODUCT_ID,
                "COOKIE",
                "cookie",
                "Biscuit personnalisé",
                "",
                CommercialType.GOODS,
                ProductType.INGREDIENT_CUSTOMIZATION,
                ProductCategory.TASTING,
                null,
                List.of(new ProductBom(null, commonBomId, new BigDecimal("1.5"), 0)),
                new BigDecimal("0.30"),
                "/cookie.jpg",
                List.of(),
                "Disponible",
                true,
                true,
                0,
                List.of(new ProductPurchaseMode(
                        null, "unit", "Unité", 1, Money.of(8), AllocationType.NONE, true, 0)),
                null,
                List.of(new ProductIngredientOption(
                        null, "sprinkles", "Confettis", extraBomId,
                        1, 0, 4, Money.of(1.5), true, 0)));
        when(products.get(PRODUCT_ID)).thenReturn(product);
        CatalogOrderingService service = new CatalogOrderingService(products);

        CatalogOrderingApi.BomPlan plan = service.bomPlan(new CatalogOrderingApi.ProductSelection(
                PRODUCT_ID,
                "unit",
                null,
                List.of(),
                List.of(new CatalogOrderingApi.IngredientSelection("sprinkles", 3))));

        assertEquals(List.of(
                new CatalogOrderingApi.ApplicableBom(commonBomId, new BigDecimal("1.5"), "Biscuit personnalisé"),
                new CatalogOrderingApi.ApplicableBom(extraBomId, new BigDecimal("2"), "Confettis")), plan.boms());
        assertEquals(List.of(), plan.warnings());
    }

    @Test
    void resolvesEachFlavorAllocationForAConfigurableBundle() {
        UUID chickenBomId = UUID.randomUUID();
        UUID tunaBomId = UUID.randomUUID();
        Product product = new Product(
                PRODUCT_ID,
                "PATTY_BOX",
                "patty-box",
                "Boîte de pâtés",
                "",
                CommercialType.GOODS,
                ProductType.SINGLE_CHOICE_BUNDLE,
                ProductCategory.TASTING,
                null,
                List.of(),
                new BigDecimal("0.30"),
                "/box.jpg",
                List.of(),
                "Disponible",
                true,
                true,
                0,
                List.of(new ProductPurchaseMode(
                        null, "box", "Boîte de 20", 20, Money.of(50),
                        AllocationType.CHOICE_ALLOCATION, true, 0)),
                new ProductChoiceGroup(
                        null,
                        "Saveur",
                        true,
                        List.of(
                                new ProductChoiceOption(null, "chicken", "Poulet", chickenBomId, true, 0),
                                new ProductChoiceOption(null, "tuna", "Thon", tunaBomId, true, 1))),
                List.of());
        when(products.get(PRODUCT_ID)).thenReturn(product);
        CatalogOrderingService service = new CatalogOrderingService(products);

        CatalogOrderingApi.BomPlan plan = service.bomPlan(new CatalogOrderingApi.ProductSelection(
                PRODUCT_ID,
                "box",
                null,
                List.of(
                        new CatalogOrderingApi.ChoiceAllocation("chicken", 12),
                        new CatalogOrderingApi.ChoiceAllocation("tuna", 8)),
                List.of()));

        assertEquals(List.of(
                new CatalogOrderingApi.ApplicableBom(chickenBomId, new BigDecimal("12"), "Poulet"),
                new CatalogOrderingApi.ApplicableBom(tunaBomId, new BigDecimal("8"), "Thon")), plan.boms());
    }

    @Test
    void sellsAServiceWithoutBomWithoutCreatingProductionRequirements() {
        Product serviceProduct = new Product(
                PRODUCT_ID,
                "INSTALLATION",
                "installation",
                "Service d'installation",
                "",
                CommercialType.SERVICE,
                ProductType.STANDARD,
                ProductCategory.DECORATION,
                null,
                List.of(),
                new BigDecimal("0.30"),
                "/installation.jpg",
                List.of(),
                "Sur rendez-vous",
                true,
                true,
                0,
                List.of(new ProductPurchaseMode(
                        null, "service", "Service", 1, Money.of(150), AllocationType.NONE, true, 0)),
                null,
                List.of());
        when(products.get(PRODUCT_ID)).thenReturn(serviceProduct);
        CatalogOrderingService service = new CatalogOrderingService(products);
        CatalogOrderingApi.ProductSelection selection = new CatalogOrderingApi.ProductSelection(
                PRODUCT_ID, "service", null, List.of(), List.of());

        CatalogOrderingApi.ProductSnapshot snapshot = service.snapshot(selection);
        CatalogOrderingApi.BomPlan plan = service.bomPlan(selection);

        assertEquals(15000, snapshot.unitPriceCents());
        assertEquals(List.of(), plan.boms());
        assertEquals(List.of(), plan.warnings());
    }
}
