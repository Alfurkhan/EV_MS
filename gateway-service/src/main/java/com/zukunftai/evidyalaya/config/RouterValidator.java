
package com.zukunftai.evidyalaya.config;

import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.function.Predicate;

@Component
public class RouterValidator {

    private static final Set<String> OPEN_API_ENDPOINTS = Set.of(
            "/auth/register/user",
            "/auth/check/email",
            "/auth/send/email",
            "/auth/verify-registration-otp",
            "/auth/login",

            // Forgot-password flow
            "/auth/forgot-password/send-otp",
            "/auth/forgot-password/verify-otp",
            "/auth/forgot-password/reset",

            // Public school branding
            "/public/school-branding"
    );

    private static final String PUBLIC_LOGO_PATH_PREFIX =
            "/public/school-branding/logo/";

    public Predicate<ServerHttpRequest> isSecured =
            request -> {
                String path = request.getURI().getPath();

                boolean isPublicEndpoint =
                        OPEN_API_ENDPOINTS.contains(path)
                                || path.startsWith(PUBLIC_LOGO_PATH_PREFIX);

                return !isPublicEndpoint;
            };
}
