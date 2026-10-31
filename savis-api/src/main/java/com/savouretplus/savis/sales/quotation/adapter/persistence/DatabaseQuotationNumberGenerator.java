package com.savouretplus.savis.sales.quotation.adapter.persistence;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import com.savouretplus.savis.sales.quotation.port.QuotationNumberGenerator;

import lombok.AllArgsConstructor;

/** Generates durable, human-readable quotation numbers. */
@Component
@AllArgsConstructor
public class DatabaseQuotationNumberGenerator implements QuotationNumberGenerator {
    private final JdbcClient jdbc;

    /** Reads the durable PostgreSQL sequence and formats its business number. */
    @Override
    public String next() {
        Long value = jdbc.sql("select nextval('savis_api.quotation_number_sequence')")
                .query(Long.class).single();
        return "SOU-%08d".formatted(value);
    }
}
