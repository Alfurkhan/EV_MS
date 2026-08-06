package com.zukunftai.evidyalaya.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;

@OpenAPIDefinition(
        info = @Info(
                description = "OpenApi documentation for Spring Security",
                title = "OpenApi specification",
                version = "1.0"
        ),
        servers = {
                @Server(
                        description = "Local ENV",
                        url = "http://localhost:8080"
                ),
                @Server(
                        description = "Dev Test",
                        url = "http://65.0.255.154:9090"
                ),
                @Server(
                        description = "PROD ENV",
                        url = "https://cubera-daiv-api.vectorstack.co"
                )
        },
        security = {
                @SecurityRequirement(
                        name = "bearerAuth"
                )
        }
)
@SecurityScheme(
        name = "bearerAuth",
        description = "JWT auth description",
        scheme = "bearer",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
        @Bean
        public GroupedOpenApi controllerApi() {
                return GroupedOpenApi.builder()
                        .group("controller-api")
                        .packagesToScan("com.zukunftai.evidyalaya.controller") // Specify the package to scan
                        .build();
        }
}
