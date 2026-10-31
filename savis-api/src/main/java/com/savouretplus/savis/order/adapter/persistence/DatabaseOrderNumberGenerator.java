package com.savouretplus.savis.order.adapter.persistence;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.port.OrderNumberGenerator;

import lombok.AllArgsConstructor;

/**
 * Generates durable order numbers from the SAVIS PostgreSQL sequence.
 */
@Component
@AllArgsConstructor
public class DatabaseOrderNumberGenerator implements OrderNumberGenerator {
    private final JdbcClient jdbcClient;

    /**
     * Returns the next formatted number for the provided order source.
     */
    @Override
    public String next(OrderSource source) {
        Long value = jdbcClient.sql("select nextval('savis_api.order_number_sequence')")
                .query(Long.class)
                .single();
        String prefix = source == OrderSource.SAVOURETPLUS_WEB ? "WEB" : "ADM";
        return "%s-%08d".formatted(prefix, value);
    }
}
