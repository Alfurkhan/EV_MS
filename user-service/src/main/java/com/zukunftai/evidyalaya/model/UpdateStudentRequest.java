package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class UpdateStudentRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 4, max = 200, message = "Full name must be between 4 and 200 characters")
    @Pattern(
            regexp = "^[A-Za-z ]+$",
            message = "Full name can contain only letters and spaces"
    )
    private String fullName;

    @Size(max = 10, message = "Country code must not exceed 10 characters")
    private String countryCode;

    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^[0-9]{10}$",
            message = "Phone number must contain exactly 10 digits"
    )
    private String phoneNumber;
}