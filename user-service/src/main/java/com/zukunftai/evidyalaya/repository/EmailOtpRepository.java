package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.EmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {

    Optional<EmailOtp> findTopByEmailAndUsedFalseOrderByIdDesc(String email);
}