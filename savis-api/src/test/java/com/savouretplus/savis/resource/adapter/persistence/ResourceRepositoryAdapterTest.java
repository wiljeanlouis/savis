package com.savouretplus.savis.resource.adapter.persistence;

import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.resource.domain.Resource;
import com.savouretplus.savis.resource.domain.ResourceCategory;
import com.savouretplus.savis.resource.domain.ResourceStatus;
import com.savouretplus.savis.resource.port.ResourceRepository;
import com.savouretplus.savis.resource.port.ResourceSort;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ResourceRepositoryAdapterTest {
    @Autowired ResourceRepository repository;

    @BeforeEach void resources() {
        save("Zeste", ResourceCategory.INGREDIENT, Unit.MILLILITER, ResourceStatus.ACTIVE);
        save("Alpha", ResourceCategory.EQUIPMENT, null, ResourceStatus.ACTIVE);
        save("Boîte", ResourceCategory.PACKAGING, Unit.PIECE, ResourceStatus.ACTIVE);
        save("Câble", ResourceCategory.CONSUMABLE, Unit.KILOGRAM, ResourceStatus.INACTIVE);
        save("Décor", ResourceCategory.DECORATION_MATERIAL, Unit.GRAM, ResourceStatus.ACTIVE);
    }

    static Stream<Arguments> sorts() {
        return Stream.of(
                Arguments.of(ResourceSort.NAME_ASC, List.of("Alpha", "Boîte", "Câble", "Décor", "Zeste")),
                Arguments.of(ResourceSort.NAME_DESC, List.of("Zeste", "Décor", "Câble", "Boîte", "Alpha")),
                Arguments.of(ResourceSort.CATEGORY_ASC, List.of("Câble", "Boîte", "Alpha", "Zeste", "Décor")),
                Arguments.of(ResourceSort.CATEGORY_DESC, List.of("Décor", "Zeste", "Alpha", "Boîte", "Câble")),
                Arguments.of(ResourceSort.UNIT_ASC, List.of("Décor", "Câble", "Zeste", "Boîte", "Alpha")),
                Arguments.of(ResourceSort.UNIT_DESC, List.of("Boîte", "Zeste", "Câble", "Décor", "Alpha")));
    }

    @ParameterizedTest @MethodSource("sorts")
    void sortsActualValuesWithMissingUnitsLastInBothDirections(ResourceSort sort, List<String> expected) {
        assertEquals(expected, repository.search("", null, null, 0, 20, sort).content().stream().map(Resource::name).toList());
    }

    @Test void ordersTheWholeResultBeforePaginationAndCountsAllMatchingRows() {
        var first = repository.search("", null, null, 0, 2, ResourceSort.CATEGORY_ASC);
        var second = repository.search("", null, null, 1, 2, ResourceSort.CATEGORY_ASC);
        assertEquals(List.of("Câble", "Boîte"), first.content().stream().map(Resource::name).toList());
        assertEquals(List.of("Alpha", "Zeste"), second.content().stream().map(Resource::name).toList());
        assertEquals(5, first.totalElements());
        assertEquals(3, first.totalPages());
        assertEquals(second, repository.search("", null, null, 1, 2, ResourceSort.CATEGORY_ASC));
    }

    @Test void combinesCategoryStatusAndLiteralSearchBeforeSorting() {
        assertEquals(List.of("Boîte"), repository.search("boîte", ResourceCategory.PACKAGING, ResourceStatus.ACTIVE,
                0, 10, ResourceSort.UNIT_DESC).content().stream().map(Resource::name).toList());
        assertTrue(repository.search("", ResourceCategory.CONSUMABLE, ResourceStatus.ACTIVE, 0, 10, ResourceSort.NAME_ASC).content().isEmpty());
        save("100% coton", ResourceCategory.CONSUMABLE, Unit.GRAM, ResourceStatus.ACTIVE);
        assertEquals(1, repository.search("%", null, null, 0, 10, ResourceSort.NAME_ASC).totalElements());
    }

    private void save(String name, ResourceCategory category, Unit unit, ResourceStatus status) {
        repository.save(new Resource(UUID.randomUUID(), name, name, category, unit, status));
    }
}
