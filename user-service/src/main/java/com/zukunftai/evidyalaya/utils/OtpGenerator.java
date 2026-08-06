package com.zukunftai.evidyalaya.utils;

import java.util.Random;

public class OtpGenerator {

    public static String generateOtp(int length) {
        StringBuilder otp = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < length; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }
}
