package com.zukunftai.evidyalaya.model;


import com.zukunftai.evidyalaya.service.api.validator.IsValidPhoneNumber;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Date;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {

//    @NotNull
//    @NotEmpty(message = "full name can not be null")
    private String fullName;
//    @NotNull
//    @NotEmpty
    @Email
    private String email;

//    @NotNull
//    @NotEmpty
    private String countryCode;

    @Size(max = 10)
    @IsValidPhoneNumber
    private String phoneNumber;

    private RegisteredSource platform;

}

