package com.zukunftai.evidyalaya.model;

import com.zukunftai.evidyalaya.database.RoleName;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@Builder
public class JwtResponse {

    private Long userId;
    private String accessToken;
    private String tokenType;
    private Set<RoleName> roles;
    private Long expireAt;
    private String refreshToken;

    public JwtResponse(
            Long userId,
            String accessToken,
            String tokenType,
            Set<RoleName> roles,
            Long expireAt,
            String refreshToken
    ) {
        this.userId = userId;
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.roles = roles;
        this.expireAt = expireAt;
        this.refreshToken = refreshToken;
    }
}