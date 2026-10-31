package com.savouretplus.savis.catalog.adapter.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Spring Data repository for catalog product entities.
 */
interface ProductJpaRepository extends JpaRepository<ProductEntity, Long> {
    /**
     * Finds an aggregate by its public identifier.
     */
    Optional<ProductEntity> findByPublicId(UUID publicId);
    /**
     * Returns entities ordered by display order and name.
     */
    List<ProductEntity> findAllByOrderByDisplayOrderAscNameAsc();

    /**
     * Searches catalog products by code, name, or description.
     */
    @Query("""
            select product
            from ProductEntity product
            where (:availableOnly = false or product.available = true)
              and (:search = ''
                or lower(product.code) like lower(concat('%', :search, '%'))
                or lower(product.name) like lower(concat('%', :search, '%'))
                or lower(product.description) like lower(concat('%', :search, '%')))
            order by product.displayOrder asc, product.name asc
            """)
    List<ProductEntity> search(
            @Param("search") String search,
            @Param("availableOnly") boolean availableOnly,
            Pageable pageable);

    /**
     * Finds a value by published true order by display order asc name asc.
     */
    List<ProductEntity> findByPublishedTrueOrderByDisplayOrderAscNameAsc();
}
