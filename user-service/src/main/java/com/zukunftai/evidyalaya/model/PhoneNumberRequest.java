package com.zukunftai.evidyalaya.model;

import com.zukunftai.evidyalaya.service.api.validator.IsValidPhoneNumber;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PhoneNumberRequest {
    @NotNull(message = "Country code is required")
    @NotEmpty(message = "Country code cannot be empty")
    private String countryCode;

    @NotNull(message = "Phone number is required")
    @NotEmpty(message = "Phone number cannot be empty")
    @Size(max = 10, message = "Phone number must not exceed 10 digits")
    @IsValidPhoneNumber
    private String phoneNumber;
}
