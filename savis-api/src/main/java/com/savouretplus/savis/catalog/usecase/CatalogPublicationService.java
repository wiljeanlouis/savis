package com.savouretplus.savis.catalog.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.port.ProductRepository;
import com.savouretplus.savis.catalog.port.PublishedCatalogPort;

import lombok.AllArgsConstructor;

/**
 * Publishes catalog products with their categories and pricing state.
 */
@Service
@Transactional
@AllArgsConstructor
public class CatalogPublicationService {
    private final ProductRepository productRepository;
    private final PublishedCatalogPort publishedCatalogPort;
    private final PublishedCatalogProductMapper mapper;

    /**
     * Publishes catalog products or outbound events through the configured port.
     */
    public void publish(UUID productId) {
        requirePublicationEnabled();
        Product product = setPublished(productId, true);
        publishProjection(product);
    }

    private void publishProjection(Product product) {
        publishedCatalogPort.publish(mapper.map(product));
    }

    /**
     * Removes a product from the published catalog projection.
     */
    public void unpublish(UUID productId) {
        requirePublicationEnabled();
        setPublished(productId, false);
        publishedCatalogPort.unpublish(productId.toString());
    }

    /**
     * Publishes all catalog products to the external catalog.
     */
    public PublicationResult publishAll() {
        requirePublicationEnabled();
        List<Product> products = productRepository.findAllPublished();
        products.forEach(this::publishProjection);
        return new PublicationResult(products.size());
    }

    private void requirePublicationEnabled() {
        if (!publishedCatalogPort.isEnabled()) {
            throw new IllegalStateException(
                    "La publication Supabase est désactivée. Configurez SUPABASE_ENABLED=true, "
                            + "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.");
        }
    }

    private Product setPublished(UUID productId, boolean published) {
        Product product = productRepository.findByPublicId(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        return productRepository.save(product.withPublished(published));
    }

    /**
     * Summarizes the result of a catalog publication run.
     */
    public record PublicationResult(int publishedProductCount) {
    }
}
