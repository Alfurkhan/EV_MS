package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.Instant;

@Data
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;

    private String username;

    @Size(max = 200)
    private String fullName;

    @Size(max = 320)
    @Email
    private String email;

    @Size(max = 10)
    private String countryCode;

    private String phoneNumber;

    private String registeredSource;

    private boolean accountEnabled;

    private boolean accountLocked;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @LastModifiedDate
    private Instant lastLoginAt;

    private boolean emailVerified;

    private boolean termPolicyViewed;

    private String role;
}