package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordOtpRequest {

    @NotBlank
    @Email
    private String email;
}