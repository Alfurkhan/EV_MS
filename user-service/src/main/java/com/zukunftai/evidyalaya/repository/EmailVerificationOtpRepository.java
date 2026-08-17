package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.EmailVerificationOtp;
import com.zukunftai.evidyalaya.database.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationOtpRepository
        extends JpaRepository<EmailVerificationOtp, Long> {

    Optional<EmailVerificationOtp> findTopByUserAndVerifiedFalseOrderByCreatedAtDesc(User user);
}