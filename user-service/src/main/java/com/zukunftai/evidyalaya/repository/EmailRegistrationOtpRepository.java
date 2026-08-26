package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.EmailRegistrationOtp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.time.Instant;

public interface EmailRegistrationOtpRepository
        extends JpaRepository<EmailRegistrationOtp, Long> {

    Optional<EmailRegistrationOtp>
    findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(String email);

    Optional<EmailRegistrationOtp>
    findTopByEmailAndVerifiedTrueOrderByCreatedAtDesc(String email);

    void deleteById(Long id);

    void deleteByExpiresAtBefore(Instant time);

}