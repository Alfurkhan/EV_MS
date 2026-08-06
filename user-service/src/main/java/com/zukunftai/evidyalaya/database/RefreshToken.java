package com.zukunftai.evidyalaya.database;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;

import java.time.Instant;

@Entity
@Table(name = "\"refresh_tokens\"")
@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Column(name = "ref_token", unique = true)
    private String refreshToken;

    @Column(name = "expired_at")
    @CreatedDate
    private Instant expiredAt;
}