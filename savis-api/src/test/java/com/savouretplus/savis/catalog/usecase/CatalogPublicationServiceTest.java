package com.savouretplus.savis.catalog.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductCategory;
import com.savouretplus.savis.catalog.domain.ProductType;
import com.savouretplus.savis.catalog.port.ProductCategoryRepository;
import com.savouretplus.savis.catalog.port.ProductRepository;
import com.savouretplus.savis.catalog.port.PublishedCatalogPort;
import com.savouretplus.savis.catalog.port.PublishedCatalogProduct;
import com.savouretplus.savis.common.Money;

@ExtendWith(MockitoExtension.class)
class CatalogPublicationServiceTest {
    @Mock ProductRepository products;
    @Mock ProductCategoryRepository categories;
    @Mock PublishedCatalogPort publishedCatalog;

    CatalogPublicationService service;

    @BeforeEach
    void setUp() {
        service = new CatalogPublicationService(
                products, categories, publishedCatalog, new PublishedCatalogProductMapper());
    }

    @Test
    void refusesToReportSuccessWhenSupabaseIsDisabled() {
        when(publishedCatalog.isEnabled()).thenReturn(false);

        IllegalStateException error = assertThrows(IllegalStateException.class, service::publishAll);

        assertEquals(true, error.getMessage().contains("SUPABASE_ENABLED=true"));
    }

    @Test
    void returnsTheNumberOfProductsActuallyPublished() {
        Product product = product();
        ProductCategory category = new ProductCategory(
                product.categoryId(), "degustation", "Dégustation", true, 0);
        when(publishedCatalog.isEnabled()).thenReturn(true);
        when(products.findAllPublished()).thenReturn(List.of(product));
        when(products.findByPublicId(product.publicId())).thenReturn(Optional.of(product));
        when(categories.findByPublicId(product.categoryId())).thenReturn(Optional.of(category));

        var result = service.publishAll();

        assertEquals(1, result.publishedProductCount());
        verify(publishedCatalog).publish(org.mockito.ArgumentMatchers.any(PublishedCatalogProduct.class));
    }

    private Product product() {
        return new Product(
                UUID.randomUUID(), "pate", "pate", "Pâté", "", ProductType.STANDARD,
                UUID.randomUUID(), List.of(), Money.of(5), new BigDecimal("0.30"), "unité",
                "/pate.jpg", List.of(), "Disponible", true, true, 0,
                List.of(), null, List.of());
    }
}
