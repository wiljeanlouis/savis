package com.savouretplus.savis.catalog.adapter.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.catalog.domain.AllocationType;
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
class ProductRepositoryAdapterTest {
    @Mock ProductJpaRepository repository;

    @Test
    void updatesExistingAggregateChildrenWithoutReinsertingTheirPublicIds() {
        UUID productId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();
        UUID choiceId = UUID.randomUUID();
        UUID modeId = UUID.randomUUID();
        UUID ingredientId = UUID.randomUUID();
        UUID productBomId = UUID.randomUUID();
        UUID bomId = UUID.randomUUID();

        ProductEntity entity = entity(productId);
        ProductChoiceGroupEntity existingGroup = new ProductChoiceGroupEntity();
        existingGroup.setId(10L);
        existingGroup.setPublicId(groupId);
        ProductChoiceOptionEntity existingChoice = new ProductChoiceOptionEntity();
        existingChoice.setId(11L);
        existingChoice.setPublicId(choiceId);
        existingGroup.getOptions().add(existingChoice);
        entity.setChoiceGroup(existingGroup);

        ProductPurchaseModeEntity existingMode = new ProductPurchaseModeEntity();
        existingMode.setId(12L);
        existingMode.setPublicId(modeId);
        entity.getPurchaseModes().add(existingMode);

        ProductIngredientOptionEntity existingIngredient = new ProductIngredientOptionEntity();
        existingIngredient.setId(13L);
        existingIngredient.setPublicId(ingredientId);
        entity.getIngredientOptions().add(existingIngredient);

        ProductBomEntity existingProductBom = new ProductBomEntity();
        existingProductBom.setId(14L);
        existingProductBom.setPublicId(productBomId);
        entity.getProductBoms().add(existingProductBom);

        when(repository.findByPublicId(productId)).thenReturn(Optional.of(entity));
        when(repository.save(any(ProductEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        new ProductRepositoryAdapter(repository).save(new Product(
                productId, "pate", "pate", "Pâté", "", ProductType.SINGLE_CHOICE,
                ProductCategory.TASTING, List.of(new ProductBom(productBomId, bomId, new BigDecimal("1.5"), 0)),
                new BigDecimal("0.30"),
                "/pate.jpg", List.of(), "Disponible", true, false, 0,
                List.of(new ProductPurchaseMode(
                        modeId, "unit", "À l'unité", 1, Money.of(5),
                        AllocationType.SINGLE_CHOICE, true, 0)),
                new ProductChoiceGroup(groupId, "Nouvelle farce", true, List.of(
                        new ProductChoiceOption(choiceId, "chicken", "Poulet", null, true, 0))),
                List.of(new ProductIngredientOption(
                        ingredientId, "extra", "Extra", null, 0, 0, 2,
                        Money.of(1), true, 0))));

        assertSame(existingGroup, entity.getChoiceGroup());
        assertSame(existingChoice, entity.getChoiceGroup().getOptions().getFirst());
        assertSame(existingMode, entity.getPurchaseModes().getFirst());
        assertSame(existingIngredient, entity.getIngredientOptions().getFirst());
        assertSame(existingProductBom, entity.getProductBoms().getFirst());
        assertEquals(10L, entity.getChoiceGroup().getId());
        assertEquals("Nouvelle farce", entity.getChoiceGroup().getLabel());
        assertEquals(new BigDecimal("1.5"), entity.getProductBoms().getFirst().getQuantity());
    }

    private ProductEntity entity(UUID productId) {
        ProductEntity entity = new ProductEntity();
        entity.setId(1L);
        entity.setPublicId(productId);
        entity.setCode("pate");
        entity.setSlug("pate");
        entity.setName("Pâté");
        entity.setDescription("");
        entity.setProductType(ProductType.SINGLE_CHOICE);
        entity.setCategory(ProductCategory.TASTING);
        entity.setTargetMarginRate(new BigDecimal("0.30"));
        entity.setImageUrl("/pate.jpg");
        entity.setAvailabilityNote("Disponible");
        return entity;
    }
}
