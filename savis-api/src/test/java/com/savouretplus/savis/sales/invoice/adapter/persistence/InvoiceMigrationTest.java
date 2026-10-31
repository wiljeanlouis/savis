package com.savouretplus.savis.sales.invoice.adapter.persistence;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

class InvoiceMigrationTest {
    @Test
    void declaresPostgresqlUniquenessFinancialAndLifecycleConstraints() throws IOException {
        try (var stream = getClass().getResourceAsStream(
                "/db/migration/V9__create_invoice_schema.sql")) {
            assertTrue(stream != null, "La migration Invoice doit être présente");
            String sql = new String(stream.readAllBytes(), StandardCharsets.UTF_8)
                    .toLowerCase();

            assertTrue(sql.contains("invoice_number varchar(255) unique"));
            assertTrue(sql.contains("source_order_id uuid not null unique"));
            assertTrue(sql.contains("total_cents = subtotal_cents - discount_cents"));
            assertTrue(sql.contains("constraint ck_invoices_lifecycle check"));
            assertTrue(sql.contains("jsonb_array_length(items) > 0"));
        }
    }
}
