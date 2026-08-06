package com.zukunftai.evidyalaya.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.Instant;
import java.util.*;

@Data
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;

    @Size(max = 200)
    private String fullName;

    @Size(max = 320)
    @Email
    private String email;

    @Size(max = 10)
    private String countryCode;

    private String phoneNumber;


    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @LastModifiedDate
    private Instant lastLoginAt;

    private boolean isAccountEnabled;


}
