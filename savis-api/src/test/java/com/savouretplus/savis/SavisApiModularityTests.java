package com.savouretplus.savis;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

import com.savouretplus.savis.catalog.api.CatalogOrderingApi;
import com.savouretplus.savis.sales.order.api.OrderInvoicingApi;
import com.savouretplus.savis.sales.order.api.QuotationOrderApi;
import com.savouretplus.savis.sales.order.domain.Order;
import com.savouretplus.savis.sales.order.port.OrderRepository;

public class SavisApiModularityTests {

    ApplicationModules modules = ApplicationModules.of(SavisApiApplication.class);

    @Test
    void detectsIndependentSalesChildrenAndCatalog() {
        var sales = modules.getModuleByName("sales").orElseThrow();
        assertEquals(Set.of("sales.quotation", "sales.order", "sales.invoice"),
                modules.getNestedModules(sales).stream()
                        .map(module -> module.getIdentifier().toString()).collect(Collectors.toSet()));
        for (String name : Set.of("sales.quotation", "sales.order", "sales.invoice")) {
            var child = modules.getModuleByName(name).orElseThrow();
            assertEquals(sales, modules.getParentOf(child).orElseThrow());
            assertEquals("com.savouretplus.savis." + name, child.getBasePackage().getName());
            assertFalse(child.isOpen());
        }
        var catalog = modules.getModuleByType(CatalogOrderingApi.class).orElseThrow();
        assertEquals("catalog", catalog.getIdentifier().toString());
        assertFalse(modules.hasParent(catalog));
        assertTrue(catalog.getAllDependencies(modules).stream()
                .noneMatch(dependency -> dependency.getTargetModule().getIdentifier().toString().startsWith("sales")));
    }

    @Test
    void exposesOrderContractsButKeepsDomainAndRepositoriesInternal() {
        var order = modules.getModuleByType(QuotationOrderApi.class).orElseThrow();
        assertEquals("sales.order", order.getIdentifier().toString());
        assertTrue(order.isExposed(QuotationOrderApi.class));
        assertTrue(order.isExposed(OrderInvoicingApi.class));
        assertFalse(order.isExposed(Order.class));
        assertFalse(order.isExposed(OrderRepository.class));
    }

    @Test
    void rejectsSiblingEntityAndRepositoryAccess() {
        var invalid = ApplicationModules.of("com.savouretplus.salesboundaryfixture", location -> true);
        assertEquals("sales", invalid.getParentOf(invalid.getModuleByName("sales.order").orElseThrow())
                .orElseThrow().getIdentifier().toString());
        var violations = assertThrows(org.springframework.modulith.core.Violations.class, invalid::verify);
        assertFalse(violations.getMessage().contains("PublicOrderApi"), violations.getMessage());
        assertTrue(violations.getMessages().stream()
                .anyMatch(message -> message.contains("Allowed targets: sales.order :: order") && message.contains("InternalEntity")),
                violations.getMessage());
        assertTrue(violations.getMessages().stream()
                .anyMatch(message -> message.contains("Allowed targets: sales.order :: order") && message.contains("InternalRepository")),
                violations.getMessage());
    }

    @Test
    @DisplayName("Verify Modularity of Savis API")
    void verifyModularity() {
        System.out.println(modules.toString());
        modules.verify();
    }

    @Test
    @DisplayName("Write PlantUML Documentation Snippets")
    void writePlantUmlDocumentationSnippets() {

        new Documenter(modules)
                .writeDocumentation();
    }
}
