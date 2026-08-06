package com.zukunftai.evidyalaya.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDetails {
    private Long id;
    private String name;
    private String email;
    private String countryCode;
    private String phoneNumber;
}
