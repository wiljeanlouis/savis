package com.savouretplus.savis.catalog.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.port.ProductCategoryRepository;
import com.savouretplus.savis.catalog.port.ProductRepository;
import com.savouretplus.savis.catalog.port.PublishedCatalogPort;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
@AllArgsConstructor
public class CatalogPublicationService {
    private final ProductRepository productRepository;
    private final ProductCategoryRepository categoryRepository;
    private final PublishedCatalogPort publishedCatalogPort;
    private final PublishedCatalogProductMapper mapper;

    public void publish(UUID productId) {
        Product product = productRepository.findByPublicId(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        if (!product.published()) {
            publishedCatalogPort.unpublish(productId.toString());
            return;
        }
        var category = categoryRepository.findByPublicId(product.categoryId())
                .orElseThrow(() -> new ProductCategoryNotFoundException(product.categoryId()));
        publishedCatalogPort.publish(mapper.map(product, category));
    }

    public PublicationResult publishAll() {
        requirePublicationEnabled();
        List<Product> products = productRepository.findAllPublished();
        log.info("Publishing {} catalog products", products.size());
        products.forEach(product -> publish(product.publicId()));
        return new PublicationResult(products.size());
    }

    @Scheduled(cron = "${savis.catalog.refresh-cron:0 0 * * * *}")
    public void scheduledPublication() {
        if (!publishedCatalogPort.isEnabled()) {
            log.debug("Catalog publication skipped because Supabase is disabled");
            return;
        }
        try {
            publishAll();
        } catch (RuntimeException exception) {
            log.error("Unable to refresh the published catalog", exception);
        }
    }

    private void requirePublicationEnabled() {
        if (!publishedCatalogPort.isEnabled()) {
            throw new IllegalStateException(
                    "La publication Supabase est désactivée. Configurez SUPABASE_ENABLED=true, "
                            + "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.");
        }
    }

    public record PublicationResult(int publishedProductCount) {
    }
}
