package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubjectRequest {

    @NotBlank(message = "Subject name is required")
    @Size(max = 150, message = "Subject name is too long")
    private String name;

    @NotBlank(message = "Subject code is required")
    @Size(max = 50, message = "Subject code is too long")
    private String code;

    @Size(max = 500, message = "Description is too long")
    private String description;

    private Boolean active;
}