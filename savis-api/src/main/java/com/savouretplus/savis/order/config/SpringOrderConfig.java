package com.savouretplus.savis.order.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Declares infrastructure-neutral dependencies used by the order module.
 */
@Configuration
public class SpringOrderConfig {

    /**
     * Provides the clock used to timestamp creation, imports, and lifecycle transitions.
     */
    @Bean
    Clock orderClock() {
        return Clock.systemUTC();
    }
}
