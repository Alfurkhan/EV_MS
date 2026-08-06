package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByUsername(String username);

    Optional<User> findByCountryCodeAndPhoneNumber(String countryCode, String phoneNumber);

    Optional<User> findByEmailOrCountryCodeAndPhoneNumber(String email, String countryCode, String phoneNumber);

    boolean existsByPhoneNumber(String phoneNumber);

    @Query("SELECT u FROM User u WHERE u.phoneNumber IN :phoneNumbers AND (:countryCodes IS NULL OR u.countryCode IN :countryCodes)")
    List<User> findByPhoneNumberAndCountryCode(@Param("phoneNumbers") List<String> phoneNumbers, @Param("countryCodes") List<String> countryCodes);

    @Query("SELECT u FROM User u WHERE u.phoneNumber IN :phoneNumbers")
    List<User> findByPhoneNumber(@Param("phoneNumbers") List<String> phoneNumbers);

    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.name = :roleName")
    long countByRoleName(@Param("roleName") RoleName roleName);


    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u JOIN u.roles r " +
            "WHERE (LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(u.phoneNumber) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND r.name IN (:roles) " +
            "AND (:isActive IS NULL OR u.accountEnabled = :isActive)" +
            "ORDER BY u.createdAt DESC")
    Page<User> getAllAdminsAndSubAdmins(@Param("roles") Set<RoleName> roles, @Param("search") String search, Pageable pageable, @Param("isActive") Boolean isActive);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :startOfDay AND u.createdAt <= :endOfDay")
    int countUsersRegisteredToday(Instant startOfDay, Instant endOfDay);

    @Query("SELECT u FROM User u WHERE u.id IN :userIds AND LOWER(u.fullName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<User> findAllByIdAndSearch(List<Long> userIds, String searchTerm);

    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.name = 'ROLE_SUB_ADMIN' OR r.name = 'ROLE_SYSTEM_ADMIN' AND " +
            "(:isActive IS NULL OR u.accountEnabled = :isActive)")
    int getAllSubAdminsCount(Boolean isActive);


//    List<User> findAllByRoles(RoleName roleName);

    @Query("""
    SELECT u FROM User u
    JOIN u.roles r
    WHERE r.name = :role
    AND (:enabled IS NULL OR u.accountEnabled = :enabled)
    AND (:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')))
""")
    Page<User> findAllUsersWithOnlyRoleUser(@Param("role") RoleName role,
                                            @Param("enabled") Boolean enabled,
                                            @Param("search") String search,
                                            Pageable pageable);

    @Query("""
    SELECT u
    FROM User u
    WHERE u.countryCode IN :countryCodes
      AND u.phoneNumber IN :phoneNumbers
""")
    List<User> findUsersByCountryCodeAndPhoneNumber(
            @Param("countryCodes") List<String> countryCodes,
            @Param("phoneNumbers") List<String> phoneNumbers
    );

    Page<User> findByRoles_NameAndIdNot(
            RoleName roleName,
            Long userId,
            Pageable pageable
    );

    List<User> findByCountryCodeAndPhoneNumberIn(
            String countryCode,
            List<String> phoneNumbers
    );

    @Query("""
            SELECT u
            FROM User u
            WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
            """)
    List<User> searchUsers(@Param("searchTerm") String searchTerm);
}