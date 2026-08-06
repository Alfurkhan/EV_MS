package com.zukunftai.evidyalaya.model;

import com.zukunftai.evidyalaya.database.RoleName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JwtAuthentication {
    private String accessToken;
    private String tokenType = "Bearer";
    private Set<RoleName> roles;

    public JwtAuthentication(String accessToken,Set<RoleName> roles) {
        this.accessToken = accessToken;
        this.roles = roles;
    }

}
