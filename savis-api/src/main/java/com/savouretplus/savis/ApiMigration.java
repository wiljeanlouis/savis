package com.savouretplus.savis;

import java.util.Map;

import org.flywaydb.core.Flyway;

/** One-shot schema migration; deliberately creates no Spring context. */
final class ApiMigration {

    private ApiMigration() {
    }

    static void run(Map<String, String> environment) {
        Flyway.configure()
                .dataSource(required(environment, "SPRING_DATASOURCE_URL"),
                        required(environment, "SPRING_DATASOURCE_USERNAME"),
                        required(environment, "SPRING_DATASOURCE_PASSWORD"))
                .defaultSchema("savis_api")
                .schemas("savis_api")
                .locations("classpath:db/migration")
                .createSchemas(true)
                .cleanDisabled(true)
                .load()
                .migrate();
    }

    private static String required(Map<String, String> environment, String name) {
        String value = environment.get(name);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Missing migration configuration: " + name);
        }
        return value;
    }
}
