package com.zukunftai.evidyalaya.model;

import lombok.Data;

@Data
public class UpdateProfileRequest {

    private String fullName;
    private String countryCode;
    private String phoneNumber;

}