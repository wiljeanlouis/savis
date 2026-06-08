package com.savouretplus.savis.catalog.adapter.supabase;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import org.junit.jupiter.api.Test;

class SupabaseCatalogAdapterTest {

    @Test
    void createsAdapterWithoutSpringRestClientBuilderBean() {
        assertDoesNotThrow(() -> new SupabaseCatalogAdapter(
                "http://localhost:54321",
                "service-role-key"));
    }
}
