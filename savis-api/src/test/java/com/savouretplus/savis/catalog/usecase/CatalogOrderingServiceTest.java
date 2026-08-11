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
import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductCategory;
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
}
