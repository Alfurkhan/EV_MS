package com.zukunftai.evidyalaya.config;

import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${application.security.jwt.secret-key}")
    private String jwtSecret;

    @Value("${application.security.jwt.jwtExpirationInMs}")
    private int jwtExpirationInMs;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {

        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        return Jwts.parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    public String GenerateToken(String username, Set<RoleName> roles, User user) {

        Map<String, Object> claims = new HashMap<>();
        claims.put("Roles", roles);
        claims.put("userId", user.getId());
        claims.put("email", user.getEmail());
        claims.put("fullName", user.getFullName());
        claims.put("countryCode", user.getCountryCode());
        claims.put("phoneNumber", user.getPhoneNumber());

        return createToken(claims, username);
    }

    private String createToken(Map<String, Object> claims, String username) {

        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationInMs))
                .signWith(getSignKey())
                .compact();
    }

    private SecretKey getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    String getUserIdFromJWT(String token) {

        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        Claims claims = Jwts.parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("userId", Long.class);
    }

    public String getPhoneNumberFromToken(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("phoneNumber", String.class);
    }

    public String getCountryCodeFromToken(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("countryCode", String.class);
    }
}