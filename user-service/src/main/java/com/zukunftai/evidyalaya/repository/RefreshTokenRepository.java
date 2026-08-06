package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.RefreshToken;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByRefreshToken(String token);
    Optional<RefreshToken> findByUser(User user);


    void deleteByUser(User user);

    @Query(value = "SELECT user_id FROM refresh_tokens where expired_at > CURRENT_DATE - INTERVAL '15 days'", nativeQuery = true)
    List<Long> findByActiveUsers();

    @Query(value = "SELECT COUNT(*) FROM refresh_tokens where expired_at < CURRENT_DATE - INTERVAL '15 days'", nativeQuery = true)
    int findByInActiveUsers();

    @Query("""
    SELECT u FROM User u
    JOIN u.roles r
    JOIN RefreshToken rt ON rt.user = u
    WHERE r.name = :roleName AND 
          (
            LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(u.phoneNumber) LIKE LOWER(CONCAT('%', :search, '%'))
          ) 
          AND rt.expiredAt < :currentDate
""")
    Page<User> findInactiveUsersByRole(
            @Param("roleName") RoleName roleName,
            @Param("search") String search,
            @Param("currentDate") Instant currentDate,
            Pageable pageable);

    @Query("""
    SELECT u FROM User u
    JOIN u.roles r
    JOIN RefreshToken rt ON rt.user = u
    WHERE r.name = :roleName AND 
          (
            LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(u.phoneNumber) LIKE LOWER(CONCAT('%', :search, '%'))
          ) 
          AND rt.expiredAt > :currentDate
""")
    Page<User> findActiveUsersByRole(@Param("roleName") RoleName roleName,
                                     @Param("search") String search,
                                     @Param("currentDate") Instant currentDate,
                                     Pageable pageable);

}
