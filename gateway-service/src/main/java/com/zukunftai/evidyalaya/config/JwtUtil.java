package com.zukunftai.evidyalaya.config;

import com.auth0.jwt.JWT;
import com.auth0.jwt.interfaces.DecodedJWT;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    @Value("${application.security.jwt.secret-key}")
    private String jwtSecret;

    public String extractUsername(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public Claims extractAllClaims(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        return Jwts.parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private boolean validateTokenExpiry(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        DecodedJWT decodedJWT = JWT.decode(token);
        logger.info("JWT Expiry : {}", decodedJWT.getExpiresAt());

        return decodedJWT.getExpiresAt().before(new Date());
    }

    private SecretKey getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public Long getUserId(String token) {
        Claims claims = extractAllClaims(token);
        return Long.valueOf(claims.get("userId").toString());
    }

    public String getUserEmail(String token) {
        Claims claims = extractAllClaims(token);
        return (String) claims.get("email");
    }

    public String getUserPhoneNumber(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("countryCode") + claims.get("phoneNumber").toString();
    }

    public boolean isTokenExpired(String token) {
        return validateTokenExpiry(token);
    }
}