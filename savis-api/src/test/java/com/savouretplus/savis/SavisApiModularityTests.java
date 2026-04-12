package com.savouretplus.savis;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

public class SavisApiModularityTests {

	ApplicationModules modules = ApplicationModules.of(SavisApiApplication.class);

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
