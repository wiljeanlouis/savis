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
import com.savouretplus.savis.catalog.domain.ProductPurchaseMode;
import com.savouretplus.savis.catalog.domain.ProductType;
import com.savouretplus.savis.catalog.domain.AllocationType;
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
        Product product = product(true);
        ProductCategory category = new ProductCategory(
                product.categoryId(), "degustation", "Dégustation", true, 0);
        when(publishedCatalog.isEnabled()).thenReturn(true);
        when(products.findAllPublished()).thenReturn(List.of(product));
        when(categories.findByPublicId(product.categoryId())).thenReturn(Optional.of(category));

        var result = service.publishAll();

        assertEquals(1, result.publishedProductCount());
        verify(publishedCatalog).publish(org.mockito.ArgumentMatchers.any(PublishedCatalogProduct.class));
    }

    @Test
    void publishesOneProductAndMarksItAsPublished() {
        Product product = product(false);
        Product publishedProduct = product.withPublished(true);
        ProductCategory category = new ProductCategory(
                product.categoryId(), "degustation", "Dégustation", true, 0);
        when(publishedCatalog.isEnabled()).thenReturn(true);
        when(products.findByPublicId(product.publicId())).thenReturn(Optional.of(product));
        when(products.save(publishedProduct)).thenReturn(publishedProduct);
        when(categories.findByPublicId(product.categoryId())).thenReturn(Optional.of(category));

        service.publish(product.publicId());

        verify(products).save(publishedProduct);
        verify(publishedCatalog).publish(org.mockito.ArgumentMatchers.any(PublishedCatalogProduct.class));
    }

    @Test
    void unpublishesOneProductAndMarksItAsUnpublished() {
        Product product = product(true);
        Product unpublishedProduct = product.withPublished(false);
        when(publishedCatalog.isEnabled()).thenReturn(true);
        when(products.findByPublicId(product.publicId())).thenReturn(Optional.of(product));
        when(products.save(unpublishedProduct)).thenReturn(unpublishedProduct);

        service.unpublish(product.publicId());

        verify(products).save(unpublishedProduct);
        verify(publishedCatalog).unpublish(product.publicId().toString());
    }

    @Test
    void refusesSingleProductPublicationWhenSupabaseIsDisabled() {
        when(publishedCatalog.isEnabled()).thenReturn(false);

        IllegalStateException error = assertThrows(
                IllegalStateException.class, () -> service.publish(UUID.randomUUID()));

        assertEquals(true, error.getMessage().contains("SUPABASE_ENABLED=true"));
    }

    private Product product(boolean published) {
        return new Product(
                UUID.randomUUID(), "pate", "pate", "Pâté", "", ProductType.STANDARD,
                UUID.randomUUID(), List.of(), new BigDecimal("0.30"),
                "/pate.jpg", List.of(), "Disponible", true, published, 0,
                List.of(new ProductPurchaseMode(
                        null, "unit", "À l'unité", 1, Money.of(5), AllocationType.NONE, true, 0)),
                null, List.of());
    }
}
