package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class CheckPhoneNumber {
    private String countryCode;
    @NotNull
    @NotBlank
    private String phoneNumber;
}
