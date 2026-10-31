package com.savouretplus.savis.supply.adapter.persistence;

import static org.junit.jupiter.api.Assertions.*;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.UUID;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

/** Runs on an isolated PostgreSQL database; every test rolls back its DDL. */
@EnabledIfEnvironmentVariable(named = "SUPPLY_MIGRATION_TEST_URL", matches = ".+")
class SupplyResourceMigrationTest {
    private Connection connection;
    @BeforeEach void setUp() throws Exception {
        connection = DriverManager.getConnection(System.getenv("SUPPLY_MIGRATION_TEST_URL"), "postgres", "postgres");
        connection.setAutoCommit(false);
        script("V1__initial_savis_api_schema.sql");
        script("V11__create_resource_reference_data.sql");
    }
    @AfterEach void tearDown() throws Exception { connection.rollback(); connection.close(); }
    private void execute(String sql) throws SQLException {
        try (var statement = connection.createStatement()) { statement.execute(sql); }
    }
    private void script(String name) throws Exception {
        try (var stream = getClass().getResourceAsStream("/db/migration/" + name)) {
            assertNotNull(stream);
            execute(new String(stream.readAllBytes(), StandardCharsets.UTF_8));
        }
    }
    private UUID resource(String name, String unit) throws SQLException {
        UUID id = UUID.randomUUID();
        try (var statement = connection.prepareStatement("insert into savis_api.resources(public_id,name,category,reference_unit,status) values (?,?,'INGREDIENT',?,'ACTIVE')")) {
            statement.setObject(1, id); statement.setString(2, name); statement.setString(3, unit); statement.executeUpdate();
        }
        return id;
    }
    private UUID offer(String name, String unit, String provider) throws SQLException {
        UUID id = UUID.randomUUID();
        try (var statement = connection.prepareStatement("insert into savis_api.offers(public_id,external_id,component_name,package_size_value,package_size_unit,price_amount,price_currency,provider_identifier,url,last_seen,status) values (?,'external',?,2,?,3.75,'CAD',?,'https://example.com/product',timestamp '2026-10-01 12:00:00','UNAVAILABLE')")) {
            statement.setObject(1, id); statement.setString(2, name); statement.setString(3, unit); statement.setString(4, provider); statement.executeUpdate();
        }
        return id;
    }
    @Test void preservesDistinctOffersAndAllExistingColumns() throws Exception {
        UUID resource = resource("Farine de blé", "GRAM");
        offer("  FARINE  de blé ", "kg", "a");
        offer("Farine de blé", "g", "b");
        execute("create temporary table before_offers as select * from savis_api.offers");
        script("V13__link_supply_offers_to_resources.sql");
        try (var statement = connection.createStatement(); var rows = statement.executeQuery("select count(*), count(distinct public_id), count(distinct resource_id) from savis_api.offers where resource_id = '" + resource + "'")) {
            assertTrue(rows.next()); assertEquals(2, rows.getInt(1)); assertEquals(2, rows.getInt(2)); assertEquals(1, rows.getInt(3));
        }
        try (var statement = connection.createStatement(); var rows = statement.executeQuery("select count(*) from savis_api.offers o join before_offers b using(id) where to_jsonb(o) - 'resource_id' is distinct from to_jsonb(b)")) {
            assertTrue(rows.next()); assertEquals(0, rows.getInt(1));
        }
    }
    @Test void rejectsAmbiguousCompatibleResources() throws Exception {
        resource("Farine", "GRAM"); resource(" farine ", "KILOGRAM"); offer("Farine", "kg", "a");
        SQLException failure = assertThrows(SQLException.class, () -> script("V13__link_supply_offers_to_resources.sql"));
        assertTrue(failure.getMessage().contains("ambiguë"));
    }
    @Test void leavesMissingAndIncompatibleMatchesUnassociated() throws Exception {
        resource("Lait", "LITER"); offer("Lait", "kg", "a"); offer("Inconnu", "piece", "b");
        script("V13__link_supply_offers_to_resources.sql");
        try (var statement = connection.createStatement(); var rows = statement.executeQuery("select count(*) from savis_api.offers where resource_id is null")) {
            assertTrue(rows.next()); assertEquals(2, rows.getInt(1));
        }
    }
    @Test void usesUnitDimensionToDisambiguateNames() throws Exception {
        UUID expected = resource("Lait", "LITER"); resource("Lait", "GRAM"); offer("Lait", "ml", "a");
        script("V13__link_supply_offers_to_resources.sql");
        try (var statement = connection.createStatement(); var rows = statement.executeQuery("select resource_id from savis_api.offers")) {
            assertTrue(rows.next()); assertEquals(expected, rows.getObject(1, UUID.class));
        }
    }
}
