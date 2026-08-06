package com.zukunftai.evidyalaya.config;

import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

@RefreshScope
@Component("name=AuthenticationFilter")
@Slf4j
public class AuthenticationFilter implements GatewayFilter {

    private final RouterValidator routerValidator;
    private final JwtUtil jwtUtil;

    @Autowired
    public AuthenticationFilter(RouterValidator routerValidator, JwtUtil jwtUtil) {
        this.routerValidator = routerValidator;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        log.info("Request: {}", request);
        if (routerValidator.isSecured.test(request)) {
            log.info("Secured request: {}", request);
            log.info("Authorization missing: {}", isAuthMissing(request));
            log.debug("JWT received");

            if (this.isAuthMissing(request)) {
                return this.onError(exchange, HttpStatus.UNAUTHORIZED);
            }

            final String token = this.getAuthHeader(request);
            log.info("request---token-"+token);
            if (token == null || token.isBlank()) {
                return this.onError(exchange, HttpStatus.UNAUTHORIZED);
            }
            if (jwtUtil.isTokenExpired(token)) {
                return this.onError(exchange, HttpStatus.FORBIDDEN);
            }
            //this.updateRequest(exchange, token);
            exchange = this.updateRequest(exchange, token);

        }
        return chain.filter(exchange);
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus httpStatus) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        return response.setComplete();
    }

    private String getAuthHeader(ServerHttpRequest request) {
        return request.getHeaders().getFirst("Authorization");
    }

    private boolean isAuthMissing(ServerHttpRequest request) {
        String authorization = request.getHeaders().getFirst("Authorization");
        return authorization == null || authorization.isBlank();
    }

    private ServerWebExchange updateRequest(ServerWebExchange exchange, String token) {
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        Claims claims = jwtUtil.extractAllClaims(token);

        Object rolesObj = claims.get("Roles");
        String roles = "";

        if (rolesObj instanceof List<?> roleList) {
            roles = roleList.stream()
                    .map(Object::toString)
                    .collect(Collectors.joining(","));
        } else if (rolesObj != null) {
            roles = rolesObj.toString();
        }

        ServerHttpRequest request = exchange.getRequest().mutate()
                .header("email", String.valueOf(claims.get("email")))
                .header("userId", String.valueOf(claims.get("userId")))
                .header("Roles", roles)
                .header("countryCode", String.valueOf(claims.get("countryCode")))
                .header("phoneNumber", String.valueOf(claims.get("phoneNumber")))
                .header("fullName", String.valueOf(claims.get("fullName")))
                .header("signUpStage", String.valueOf(claims.get("signUpStage")))
                .build();
        return exchange.mutate()
                .request(request)
                .build();
    }
}
