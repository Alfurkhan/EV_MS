package com.zukunftai.evidyalaya.model;

import lombok.Data;

@Data
public class VerifyOtp {

    private String phoneNumber;
    private String otp;
}
