package com.savouretplus.savis.invoice.adapter.persistence;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import com.savouretplus.savis.invoice.port.InvoiceNumberGenerator;

import lombok.AllArgsConstructor;

/** Generates durable, human-readable invoice numbers when drafts are issued. */
@Component
@AllArgsConstructor
public class DatabaseInvoiceNumberGenerator implements InvoiceNumberGenerator {
    private final JdbcClient jdbc;

    /** Reads the durable PostgreSQL sequence and formats the invoice number. */
    @Override
    public String next() {
        Long value = jdbc.sql("select nextval('savis_api.invoice_number_sequence')")
                .query(Long.class).single();
        return "FAC-%08d".formatted(value);
    }
}
