package com.zukunftai.evidyalaya.model;

import com.zukunftai.evidyalaya.database.RoleName;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class EmailSignUpRequest {

    @NotNull
    @NotEmpty(message = "full name can not be null")
    private String fullName;

    @NotBlank(message = "Email is required and cannot be blank")
    @Email(message = "Invalid email format")
    @NotNull
    private String email;

    @NotBlank(message = "Password is required and cannot be blank")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,}$",
            message = "Password must be at least 6 characters long and include a mix of uppercase and lowercase letters, numbers, and symbols."
    )
    private String password;

    private RegisteredSource platform;

    @NotNull(message = "Role is required")
    @NotBlank
    private RoleName roleName;
}
