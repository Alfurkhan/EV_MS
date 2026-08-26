package com.zukunftai.evidyalaya.database;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Data
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "\"forgot_password\"")
public class ForgotPassword {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @NotNull
    @NotBlank
    private String token;

    @NotNull
    private String otp;

    private Instant createdAt;

    private Instant expiryAt;

    @OneToOne(targetEntity = User.class ,fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name= "user_id")
    private User user;

    public ForgotPassword(User user){
        this.user =user;
        createdAt = Instant.now();
        expiryAt = Instant.now().plus(10, ChronoUnit.MINUTES);
        token = UUID.randomUUID().toString();
    }
}
