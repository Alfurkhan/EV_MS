package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class SchoolSettingsUpdateRequest {

    @NotNull
    @NotEmpty
    private Map<String, String> settings;
}
