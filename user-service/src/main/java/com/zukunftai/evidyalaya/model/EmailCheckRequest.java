package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class EmailCheckRequest {

    @NotBlank(message = "Email is required and cannot be blank")
    @Email(message = "Invalid email format")
    private String email;
}
