package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.ForgotPassword;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.repository.ForgotPasswordRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;

@Service
public class ForgotPasswordService {

    private static final int OTP_LENGTH = 6;
    private static final long OTP_EXPIRATION_MINUTES = 10;

    private final ForgotPasswordRepository forgotPasswordRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    private final SecureRandom secureRandom = new SecureRandom();

    public ForgotPasswordService(
            ForgotPasswordRepository forgotPasswordRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            UserService userService) {

        this.forgotPasswordRepository = forgotPasswordRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userService = userService;
    }

    /**
     * Generates and saves a password-reset OTP for the given email.
     */
    @Transactional
    public void generateAndSaveOtp(String email) {

        email = email.toLowerCase().trim();

        User user = userRepository.findByUsername(email)
                .orElseThrow(() ->
                        new APIException(
                                "No account is associated with this email address.",
                                HttpStatus.NOT_FOUND,
                                "USER_NOT_FOUND"
                        )
                );

        // Remove any previous password-reset request.
        forgotPasswordRepository.deleteByUser(user);

        String otp = generateOtp();

        ForgotPassword forgotPassword =
                new ForgotPassword(user);

        forgotPassword.setOtp(otp);
        forgotPassword.setCreatedAt(Instant.now());
        forgotPassword.setExpiryAt(
                Instant.now().plusSeconds(
                        OTP_EXPIRATION_MINUTES * 60
                )
        );

        forgotPasswordRepository.save(forgotPassword);

        userService.invokeForgotPasswordEmail(
                user,
                otp
        );
    }

    /**
     * Verifies the password-reset OTP and returns
     * the reset token.
     */
    @Transactional
    public String verifyOtp(String email, String otp) {

        email = email.toLowerCase().trim();

        User user = userRepository.findByUsername(email)
                .orElseThrow(() ->
                        new APIException(
                                "No account is associated with this email address.",
                                HttpStatus.NOT_FOUND,
                                "USER_NOT_FOUND"
                        )
                );

        ForgotPassword forgotPassword =
                forgotPasswordRepository
                        .findTopByUserOrderByCreatedAtDesc(user)
                        .orElseThrow(() ->
                                new APIException(
                                        "No active password reset request found.",
                                        HttpStatus.BAD_REQUEST,
                                        "FORGOT_PASSWORD_REQUEST_NOT_FOUND"
                                )
                        );

        if (forgotPassword.getExpiryAt() == null ||
                forgotPassword.getExpiryAt().isBefore(Instant.now())) {

            forgotPasswordRepository.deleteByUser(user);

            throw new APIException(
                    "OTP has expired. Please request a new OTP.",
                    HttpStatus.BAD_REQUEST,
                    "FORGOT_PASSWORD_OTP_EXPIRED"
            );
        }

        if (!forgotPassword.getOtp().equals(otp)) {

            throw new APIException(
                    "Invalid OTP.",
                    HttpStatus.BAD_REQUEST,
                    "FORGOT_PASSWORD_OTP_INVALID"
            );
        }

        return forgotPassword.getToken();
    }

    /**
     * Resets the user's password using the verified reset token.
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {

        ForgotPassword forgotPassword =
                forgotPasswordRepository
                        .findByToken(token)
                        .orElseThrow(() ->
                                new APIException(
                                        "Invalid or expired password reset token.",
                                        HttpStatus.BAD_REQUEST,
                                        "INVALID_RESET_TOKEN"
                                )
                        );

        if (forgotPassword.getExpiryAt() == null ||
                forgotPassword.getExpiryAt().isBefore(Instant.now())) {

            forgotPasswordRepository.deleteByToken(token);

            throw new APIException(
                    "Password reset session has expired. Please request a new OTP.",
                    HttpStatus.BAD_REQUEST,
                    "RESET_TOKEN_EXPIRED"
            );
        }

        User user = forgotPassword.getUser();

        user.setPassword(
                passwordEncoder.encode(newPassword)
        );

        user.setUpdatedAt(Instant.now());

        userRepository.save(user);

        // Reset token must be single-use.
        forgotPasswordRepository.deleteByToken(token);
    }

    private String generateOtp() {

        int bound = (int) Math.pow(10, OTP_LENGTH);

        int otpNumber =
                secureRandom.nextInt(bound);

        return String.format(
                "%0" + OTP_LENGTH + "d",
                otpNumber
        );
    }
}