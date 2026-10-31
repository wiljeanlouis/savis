package com.savouretplus.savis.bom.adapter.persistence;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.savouretplus.savis.bom.domain.Bom;
import com.savouretplus.savis.bom.domain.BomComponent;
import com.savouretplus.savis.bom.domain.BomCost;
import com.savouretplus.savis.bom.domain.BomType;
import com.savouretplus.savis.bom.port.ComponentPrice;
import com.savouretplus.savis.bom.port.ComponentPriceRequest;
import com.savouretplus.savis.catalog.domain.AllocationType;
import com.savouretplus.savis.catalog.domain.Product;
import com.savouretplus.savis.catalog.domain.ProductBom;
import com.savouretplus.savis.catalog.domain.ProductPurchaseMode;
import com.savouretplus.savis.catalog.domain.ProductType;
import com.savouretplus.savis.catalog.port.BomPricingPort;
import com.savouretplus.savis.catalog.usecase.ProductCostService;
import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.common.Quantity;
import com.savouretplus.savis.common.Unit;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

/** Real PostgreSQL: each fixture and migration is rolled back, including its DDL. */
@EnabledIfEnvironmentVariable(named = "BOM_MIGRATION_TEST_URL", matches = ".+")
class BomResourceMigrationTest {
    private Connection connection;

    @BeforeEach
    void setUp() throws Exception {
        connection = DriverManager.getConnection(System.getenv("BOM_MIGRATION_TEST_URL"), "postgres", "postgres");
        connection.setAutoCommit(false);
        script("V1__initial_savis_api_schema.sql");
        for (String migration : List.of(
                "V2__remove_product_base_price_fields.sql",
                "V3__replace_product_category_reference_with_enum.sql",
                "V4__add_product_subcategory.sql", "V5__create_order_schema.sql",
                "V6__add_order_customer_address_and_adjustments.sql",
                "V7__add_product_commercial_type.sql", "V8__create_quotation_schema.sql",
                "V9__create_invoice_schema.sql", "V10__rename_decorative_arch_subcategory.sql",
                "V11__create_resource_reference_data.sql")) {
            script(migration);
        }
        execute("insert into savis_api.boms(public_id,name,description,image_url,type,quantity,unit) "
                + "values ('00000000-0000-0000-0000-000000000001','BOM','','','FOOD',1,'piece')");
    }

    @AfterEach
    void tearDown() throws Exception {
        if (connection != null) {
            connection.rollback();
            connection.close();
        }
    }

    private void execute(String sql) throws SQLException {
        try (var statement = connection.createStatement()) { statement.execute(sql); }
    }

    private String value(String sql) throws SQLException {
        try (var statement = connection.createStatement(); var result = statement.executeQuery(sql)) {
            assertTrue(result.next());
            return result.getString(1);
        }
    }

    private void script(String name) throws Exception {
        try (var stream = getClass().getResourceAsStream("/db/migration/" + name)) {
            assertNotNull(stream);
            execute(new String(stream.readAllBytes(), StandardCharsets.UTF_8));
        }
    }

    private void migrate() throws Exception { script("V12__link_bom_components_to_resources.sql"); }

    private void component(String name, String unit) throws SQLException {
        try (var statement = connection.prepareStatement("insert into savis_api.bom_components"
                + "(bom_id,component_name,quantity,unit,selected_offer_id) values (1,?,2.5,?,"
                + "'00000000-0000-0000-0000-000000000099')")) {
            statement.setString(1, name);
            statement.setString(2, unit);
            statement.executeUpdate();
        }
    }

    private UUID resource(String name, String unit) throws SQLException {
        UUID id = UUID.randomUUID();
        try (var statement = connection.prepareStatement("insert into savis_api.resources"
                + "(public_id,name,category,reference_unit,status) values (?,?,'DECORATION_MATERIAL',?,'ACTIVE')")) {
            statement.setObject(1, id);
            statement.setString(2, name);
            statement.setString(3, unit);
            statement.executeUpdate();
        }
        return id;
    }

    @Test
    void groupsCaseAndWhitespaceAndPreservesEveryConsumptionField() throws Exception {
        component("Farine", "g"); component("farine", "kg"); component("FARINE", "GRAM");
        component("  Sucre \t blanc  ", "g"); component("sucre blanc", "g");
        String before = value("select json_agg(c order by id)::text from savis_api.bom_components c");
        migrate();
        assertEquals("2", value("select count(*) from savis_api.resources"));
        assertEquals("1", value("select count(distinct resource_id) from savis_api.bom_components where id <= 3"));
        assertEquals("0", value("select count(*) from savis_api.bom_components where resource_id is null"));
        assertEquals(before, value("select json_agg(c order by id)::text from "
                + "(select id,bom_id,component_name,quantity,unit,selected_offer_id from savis_api.bom_components) c"));
    }

    @Test
    void keepsDifferentNamesDistinct() throws Exception {
        component("Farine blanche", "g"); component("Farine de blé entier", "g");
        migrate();
        assertEquals("2", value("select count(distinct resource_id) from savis_api.bom_components"));
    }

    @Test
    void reusesExistingUuidWithCompatibleUnit() throws Exception {
        UUID id = resource(" FARINE ", "KILOGRAM");
        component("farine", "g"); migrate();
        assertEquals(id.toString(), value("select resource_id from savis_api.bom_components"));
        assertEquals("1", value("select count(*) from savis_api.resources"));
    }

    @Test
    void acceptsVolumeConversions() throws Exception {
        component("Lait", "l"); component("lait", "MILLILITER"); migrate();
        assertEquals("1", value("select count(*) from savis_api.resources"));
    }

    @Test
    void rejectsIncompatibleComponentsWithDiagnostic() throws Exception {
        component("Farine", "g"); component("farine", "l");
        SQLException error = assertThrows(SQLException.class, this::migrate);
        assertTrue(error.getMessage().contains("farine"));
        assertTrue(error.getMessage().contains("composants"));
    }

    @Test
    void rejectsIncompatibleExistingResource() throws Exception {
        resource("Farine", "LITER"); component("farine", "g");
        assertTrue(assertThrows(SQLException.class, this::migrate).getMessage().contains("incompatibles"));
    }

    @Test
    void rejectsAmbiguousExistingResources() throws Exception {
        resource("Farine", "GRAM"); resource("FARINE", "KILOGRAM"); component("farine", "g");
        assertTrue(assertThrows(SQLException.class, this::migrate).getMessage().contains("ambiguës"));
    }

    @Test
    void rejectsUnknownUnitsAndEmptyNames() throws Exception {
        component("Farine", "unknown");
        assertTrue(assertThrows(SQLException.class, this::migrate).getMessage().contains("nom/unité"));
    }

    @Test
    void acceptsLegacyPortionsWithoutInventingPhysicalUnit() throws Exception {
        component("Décor", "portion"); component("décor", "PORTION"); migrate();
        assertEquals("1", value("select count(*) from savis_api.resources where reference_unit is null"));
    }

    @Test
    void replayFromSameFixtureProducesSameResourceUuid() throws Exception {
        component("Farine", "g");
        var before = connection.setSavepoint();
        migrate();
        String first = value("select resource_id from savis_api.bom_components");
        connection.rollback(before);
        migrate();
        assertEquals(first, value("select resource_id from savis_api.bom_components"));
    }

    @Test
    void rejectsBlankNames() throws Exception {
        component(" \t ", "g");
        assertTrue(assertThrows(SQLException.class, this::migrate).getMessage().contains("nom/unité"));
    }

    @Test
    void preservesBomAndCatalogCostsAfterSharingResources() throws Exception {
        component("Farine", "g"); component("farine", "kg"); component("FARINE", "GRAM");
        var before = pricedBom(false);
        var mode = new ProductPurchaseMode(null,
                "unit", "Unité", 1, Money.of(100), AllocationType.NONE, true, 0);
        var product = new Product(null, "code", "slug", "Produit", "",
                com.savouretplus.savis.catalog.domain.CommercialType.GOODS, ProductType.STANDARD,
                com.savouretplus.savis.catalog.domain.ProductCategory.TASTING, null,
                List.of(new ProductBom(null, UUID.fromString("00000000-0000-0000-0000-000000000001"),
                        new BigDecimal("3"), 0)),
                new BigDecimal("0.30"), "/image.jpg", List.of(), "Disponible", true, true,
                0, List.of(mode), null, List.of());
        var port = mock(BomPricingPort.class);
        var catalog = new ProductCostService(port);
        when(port.getPricing(any())).thenReturn(
                new BomPricingPort.BomPricing(
                        before.totalCost(), BigDecimal.ONE));
        var catalogBefore = catalog.calculate(product, null);
        migrate();
        var after = pricedBom(true);
        assertEquals(before, after);
        when(port.getPricing(any())).thenReturn(
                new BomPricingPort.BomPricing(
                        after.totalCost(), BigDecimal.ONE));
        assertEquals(catalogBefore, catalog.calculate(product, null));
        assertTrue(catalogBefore.complete());
        assertTrue(before.totalCost().amount().signum() > 0);
    }

    private BomCost pricedBom(boolean migrated) throws SQLException {
        var components = new ArrayList<BomComponent>();
        try (var statement = connection.createStatement(); var rows = statement.executeQuery(
                "select id,component_name,quantity,unit,selected_offer_id,"
                + (migrated ? "resource_id" : "null::uuid as resource_id")
                + " from savis_api.bom_components order by id")) {
            while (rows.next()) {
                components.add(new BomComponent(rows.getLong("id"),
                        rows.getObject("resource_id", UUID.class), rows.getString("component_name"),
                        new Quantity(rows.getDouble("quantity"),
                                Unit.fromSymbole(rows.getString("unit"))),
                        rows.getObject("selected_offer_id", UUID.class)));
            }
        }
        var bom = new Bom(UUID.randomUUID(), "BOM", "", "", "",
                BomType.FOOD, components, List.of(), null);
        var prices = new HashMap<ComponentPriceRequest,
                ComponentPrice>();
        // Fixed offer valuation fixture: 1 CAD per base unit, preserving each selected offer.
        for (var request : bom.componentPriceRequests()) {
            var amount = Money.of(request.quantity().value()
                    * request.quantity().unit().baseUnitFactor().doubleValue());
            var source = new BomCost.Source(request.selectedOfferId(),
                    request.selectedOfferId(), null, Money.of(1), null);
            prices.put(request, new ComponentPrice(
                    amount, source, List.of()));
        }
        return bom.calculateCost(prices, Map.of());
    }

    @Test
    void emptyDatabaseMigrates() throws Exception {
        migrate();
        assertEquals("0", value("select count(*) from savis_api.resources"));
    }
}
