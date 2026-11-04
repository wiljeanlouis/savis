package com.savouretplus.savis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Bootstraps the Savis Spring Boot API application.
 */
@SpringBootApplication
public class SavisApiApplication {

	/**
	 * Starts the Spring Boot application.
	 */
	public static void main(String[] args) {
		if (args.length == 1 && "migrate".equals(args[0])) {
			ApiMigration.run(System.getenv());
			return;
		}
		SpringApplication.run(SavisApiApplication.class, args);
	}

}
