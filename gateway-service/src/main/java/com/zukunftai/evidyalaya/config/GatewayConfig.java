package com.zukunftai.evidyalaya.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class GatewayConfig {

    @Value("${endpoint.user-service}")
    private String userServiceUrl;

    private final AuthenticationFilter filter;

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {

        return builder.routes()

                /*
                 * User APIs
                 */
                .route(
                        "user-service-user",
                        r -> r.path("/user/**")
                                .filters(f ->
                                        f.filter(filter)
                                )
                                .uri(userServiceUrl)
                )

                /*
                 * Authentication APIs
                 */
                .route(
                        "user-service-auth",
                        r -> r.path("/auth/**")
                                .filters(f ->
                                        f.filter(filter)
                                )
                                .uri(userServiceUrl)
                )

                /*
                 * Subject APIs
                 */
                .route(
                        "user-service-subject",
                        r -> r.path("/subject/**")
                                .filters(f ->
                                        f.filter(filter)
                                )
                                .uri(userServiceUrl)
                )

                /*
                 * Academic Year APIs
                 */
                .route(
                        "user-service-academic-year",
                        r -> r.path("/academic-year/**")
                                .filters(f ->
                                        f.filter(filter)
                                )
                                .uri(userServiceUrl)
                )

                /*
                 * Grade APIs
                 */
                .route(
                        "user-service-grade",
                        r -> r.path("/grade/**")
                                .filters(f ->
                                        f.filter(filter)
                                )
                                .uri(userServiceUrl)
                )

                /*
                 * Section APIs
                 */
                .route(
                        "user-service-section",
                        r -> r.path("/section/**")
                                .filters(f ->
                                        f.filter(filter)
                                )
                                .uri(userServiceUrl)
                )

                /*
                 * Student Enrollment APIs
                 */
                .route(
                        "user-service-student-enrollment",
                        r -> r.path("/student-enrollment/**")
                                .filters(f ->
                                        f.filter(filter)
                                )
                                .uri(userServiceUrl)
                )

                .build();
    }

}
