package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.EmailVerificationOtp;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.repository.EmailVerificationOtpRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;

@Service
public class EmailVerificationOtpService {

    private static final int OTP_LENGTH = 6;
    private static final long OTP_EXPIRATION_MINUTES = 10;

    private final EmailVerificationOtpRepository otpRepository;
    private final UserRepository userRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    public EmailVerificationOtpService(
            EmailVerificationOtpRepository otpRepository,
            UserRepository userRepository) {

        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public String generateAndSaveOtp(User user) {

        String otp = generateOtp();

        EmailVerificationOtp verificationOtp =
                EmailVerificationOtp.builder()
                        .user(user)
                        .otp(otp)
                        .createdAt(Instant.now())
                        .expiresAt(
                                Instant.now().plusSeconds(
                                        OTP_EXPIRATION_MINUTES * 60
                                )
                        )
                        .verified(false)
                        .build();

        otpRepository.save(verificationOtp);

        return otp;
    }

    @Transactional
    public void verifyOtp(User user, String otp) {

        EmailVerificationOtp verificationOtp =
                otpRepository
                        .findTopByUserAndVerifiedFalseOrderByCreatedAtDesc(user)
                        .orElseThrow(() ->
                                new APIException(
                                        "No active verification OTP found.",
                                        HttpStatus.BAD_REQUEST,
                                        "EMAIL_OTP_NOT_FOUND"
                                ));

        if (verificationOtp.getExpiresAt().isBefore(Instant.now())) {
            throw new APIException(
                    "OTP has expired. Please request a new OTP.",
                    HttpStatus.BAD_REQUEST,
                    "EMAIL_OTP_EXPIRED"
            );
        }

        if (!verificationOtp.getOtp().equals(otp)) {
            throw new APIException(
                    "Invalid OTP.",
                    HttpStatus.BAD_REQUEST,
                    "EMAIL_OTP_INVALID"
            );
        }

        verificationOtp.setVerified(true);
        otpRepository.save(verificationOtp);

        user.setEmailVerified(true);
        userRepository.save(user);
    }

    private String generateOtp() {

        int bound = (int) Math.pow(10, OTP_LENGTH);

        int otpNumber = secureRandom.nextInt(bound);

        return String.format(
                "%0" + OTP_LENGTH + "d",
                otpNumber
        );
    }
}