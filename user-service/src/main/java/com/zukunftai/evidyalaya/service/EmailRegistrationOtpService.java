package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.EmailRegistrationOtp;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.repository.EmailRegistrationOtpRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;

@Service
public class EmailRegistrationOtpService {

    private static final int OTP_LENGTH = 6;
    private static final long OTP_EXPIRATION_MINUTES = 10;

    private final EmailRegistrationOtpRepository otpRepository;
    private final UserRepository userRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    public EmailRegistrationOtpService(
            EmailRegistrationOtpRepository otpRepository,
            UserRepository userRepository) {

        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public String generateAndSaveOtp(String email) {

        email = email.toLowerCase().trim();

        // Don't allow registration if this email already belongs to a user.
        if (userRepository.findByUsername(email).isPresent()) {
            throw new APIException(
                    "An account with this email already exists.",
                    HttpStatus.CONFLICT,
                    "EMAIL_ALREADY_REGISTERED"
            );
        }

        String otp = generateOtp();

        Instant now = Instant.now();

        EmailRegistrationOtp registrationOtp =
                EmailRegistrationOtp.builder()
                        .email(email)
                        .otp(otp)
                        .createdAt(now)
                        .expiresAt(
                                now.plusSeconds(
                                        OTP_EXPIRATION_MINUTES * 60
                                )
                        )
                        .verified(false)
                        .build();

        otpRepository.save(registrationOtp);

        return otp;
    }

    @Transactional
    public void verifyOtp(String email, String otp) {

        email = email.toLowerCase().trim();

        EmailRegistrationOtp registrationOtp =
                otpRepository
                        .findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(email)
                        .orElseThrow(() ->
                                new APIException(
                                        "No active registration OTP found.",
                                        HttpStatus.BAD_REQUEST,
                                        "REGISTRATION_OTP_NOT_FOUND"
                                )
                        );

        // Check whether the OTP has expired.
        if (registrationOtp.getExpiresAt().isBefore(Instant.now())) {
            throw new APIException(
                    "OTP has expired. Please request a new OTP.",
                    HttpStatus.BAD_REQUEST,
                    "REGISTRATION_OTP_EXPIRED"
            );
        }

        // Check whether the OTP entered by the user is correct.
        if (!registrationOtp.getOtp().equals(otp)) {
            throw new APIException(
                    "Invalid OTP.",
                    HttpStatus.BAD_REQUEST,
                    "REGISTRATION_OTP_INVALID"
            );
        }

        // OTP is valid.
        registrationOtp.setVerified(true);
        otpRepository.save(registrationOtp);
    }

    private String generateOtp() {

        int bound = (int) Math.pow(10, OTP_LENGTH);

        int otpNumber = secureRandom.nextInt(bound);

        return String.format(
                "%0" + OTP_LENGTH + "d",
                otpNumber
        );
    }

    @Transactional
    public EmailRegistrationOtp getVerifiedOtpForRegistration(String email) {

        email = email.toLowerCase().trim();

        EmailRegistrationOtp registrationOtp =
                otpRepository
                        .findTopByEmailAndVerifiedTrueOrderByCreatedAtDesc(email)
                        .orElseThrow(() ->
                                new APIException(
                                        "Email must be verified before registration.",
                                        HttpStatus.BAD_REQUEST,
                                        "EMAIL_NOT_VERIFIED"
                                )
                        );

        if (registrationOtp.getExpiresAt().isBefore(Instant.now())) {

            throw new APIException(
                    "Email verification has expired. Please request a new OTP.",
                    HttpStatus.BAD_REQUEST,
                    "REGISTRATION_OTP_EXPIRED"
            );
        }

        return registrationOtp;
    }

    @Transactional
    public void consumeOtp(Long otpId) {
        otpRepository.deleteById(otpId);
    }
}