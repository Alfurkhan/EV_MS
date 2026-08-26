package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.ForgotPassword;
import com.zukunftai.evidyalaya.database.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ForgotPasswordRepository
        extends JpaRepository<ForgotPassword, Long> {

    Optional<ForgotPassword> findByToken(String token);

    Optional<ForgotPassword> findTopByUserOrderByCreatedAtDesc(User user);

    void deleteByUser(User user);

    void deleteByToken(String token);
}