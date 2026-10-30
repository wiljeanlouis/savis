package com.savouretplus.savis.resource.domain;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import com.savouretplus.savis.common.Unit;

class ResourceTest {
    @Test void normalizesNamesWithoutMergingIdentities() {
        var first = Resource.create("  Farine   blanche  ", "  Description  ", ResourceCategory.INGREDIENT, Unit.GRAM);
        var second = Resource.create("Farine blanche", null, ResourceCategory.INGREDIENT, Unit.GRAM);
        assertEquals("Farine blanche", first.name());
        assertEquals("Description", first.description());
        assertNotEquals(first.publicId(), second.publicId());
    }
    @Test void preservesIdentityAndStatusDuringRevision() {
        var original = Resource.create("Four", null, ResourceCategory.EQUIPMENT, null);
        var inactive = original.changeStatus(ResourceStatus.INACTIVE);
        var revised = inactive.revise("Four électrique", null, ResourceCategory.EQUIPMENT, Unit.PIECE);
        assertEquals(original.publicId(), revised.publicId());
        assertEquals(ResourceStatus.INACTIVE, revised.status());
        assertEquals(inactive, inactive.changeStatus(ResourceStatus.INACTIVE));
        assertEquals(ResourceStatus.ACTIVE, revised.changeStatus(ResourceStatus.ACTIVE).status());
    }
    @Test void rejectsInvalidDefinitions() {
        assertThrows(IllegalArgumentException.class, () -> Resource.create(" ", null, ResourceCategory.EQUIPMENT, null));
        assertThrows(IllegalArgumentException.class, () -> Resource.create("Farine", null, null, Unit.GRAM));
        assertThrows(IllegalArgumentException.class, () -> Resource.create("Farine", null, ResourceCategory.INGREDIENT, null));
        assertThrows(IllegalArgumentException.class, () -> Resource.create("Farine", null, ResourceCategory.INGREDIENT, Unit.PORTION));
        assertThrows(IllegalArgumentException.class, () -> Resource.create("Four", null, ResourceCategory.EQUIPMENT, null).changeStatus(null));
    }
}
