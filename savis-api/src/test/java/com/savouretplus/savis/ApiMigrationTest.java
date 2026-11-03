package com.savouretplus.savis;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Map;
import java.util.Properties;

import org.flywaydb.core.api.FlywayException;
import org.junit.jupiter.api.Test;

class ApiMigrationTest {

    @Test
    void missingConfigurationFailsWithoutStartingApplication() {
        var failure = assertThrows(IllegalArgumentException.class,
                () -> ApiMigration.run(Map.of()));
        assertEquals("Missing migration configuration: SPRING_DATASOURCE_URL", failure.getMessage());
    }

    @Test
    void migrationFailurePropagatesToProcess() {
        assertThrows(FlywayException.class, () -> ApiMigration.run(Map.of(
                "SPRING_DATASOURCE_URL", "jdbc:unsupported:missing-driver",
                "SPRING_DATASOURCE_USERNAME", "savis",
                "SPRING_DATASOURCE_PASSWORD", "test-password")));
    }

    @Test
    void normalStartupDisablesFlywayAndOnlyValidatesHibernate() throws Exception {
        var properties = new Properties();
        try (var stream = getClass().getResourceAsStream("/application.properties")) {
            properties.load(stream);
        }
        assertEquals("false", properties.getProperty("spring.flyway.enabled"));
        assertEquals("validate", properties.getProperty("spring.jpa.hibernate.ddl-auto"));
    }
}
