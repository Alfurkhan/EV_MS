package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.config.JwtTokenProvider;
import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.exception.ErrorCodesAndMessages;
import com.zukunftai.evidyalaya.model.*;
import com.zukunftai.evidyalaya.repository.*;
import com.zukunftai.evidyalaya.service.CustomUserDetailsService;
import com.zukunftai.evidyalaya.service.RefreshTokenService;
import com.zukunftai.evidyalaya.service.UserService;
import com.zukunftai.evidyalaya.utils.OtpGenerator;
import com.zukunftai.evidyalaya.utils.UserRequestValidator;
import jakarta.persistence.Access;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.net.URL;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j

public class UserServiceImpl implements UserService {


    @Value("${service.api.emailService}")
    private String emailServiceUrl;


    private final CustomUserDetailsService customUserDetailsService;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;

    @Autowired
    public UserServiceImpl(CustomUserDetailsService customUserDetailsService,
                           RoleRepository roleRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           RestTemplate restTemplate,
                           RefreshTokenRepository refreshTokenRepository,
                           AuthenticationManager authenticationManager,
                           JwtTokenProvider jwtTokenProvider,
                           RefreshTokenService refreshTokenService) {
        this.customUserDetailsService = customUserDetailsService;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.restTemplate = restTemplate;
        this.refreshTokenRepository = refreshTokenRepository;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
    }

    @Override
    public EmailCheckResponse checkUserExists(EmailCheckRequest request) {
        Optional<User> user = userRepository.findByUsername(request.getEmail());
        boolean databaseExists = false;
        if (user.isPresent()) {
            databaseExists = true;
        }
        return new EmailCheckResponse(databaseExists);
    }

    @Override
    public User createUser(EmailSignUpRequest registrationRequest) {

        // Only one Admin account is allowed
        if (registrationRequest.getRoleName() == RoleName.ROLE_ADMIN) {

            long adminCount =
                    userRepository.countByRoleName(RoleName.ROLE_ADMIN);

            if (adminCount > 0) {
                throw new APIException(
                        "An Admin account already exists. Only one Admin account is allowed.",
                        HttpStatus.CONFLICT,
                        "ADMIN_ALREADY_EXISTS"
                );
            }
        }

        if ((registrationRequest.getFullName() == null || registrationRequest.getFullName().isEmpty())) {
            throw new APIException(ErrorCodesAndMessages.ERROR_CODE_MISSING_FULL_NAME, HttpStatus.BAD_REQUEST, ErrorCodesAndMessages.ERROR_MESSAGE_MISSING_FULL_NAME);

        }
        if (registrationRequest.getFullName().length() < 4) {
            throw new APIException(ErrorCodesAndMessages.ERROR_CODE_INVALID_FULL_NAME, HttpStatus.BAD_REQUEST, ErrorCodesAndMessages.ERROR_MESSAGE_INVALID_FULL_NAME);
        }
        String fullName = registrationRequest.getFullName();
        if (!fullName.matches("^[A-Za-z ]+$")) {
            throw new APIException(ErrorCodesAndMessages.ERROR_CODE_INVALID_FULL_NAME, HttpStatus.BAD_REQUEST, ErrorCodesAndMessages.ERROR_MESSAGE_INVALID_FULL_NAME);
        }
        Set<Role> roles = fetchRolesFor(registrationRequest.getRoleName());
        User user = new User(registrationRequest.getEmail(), registrationRequest.getPassword());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRoles(roles);
        user.setFullName(registrationRequest.getFullName());
        if (registrationRequest.getEmail() != null) {
            user.setEmail(registrationRequest.getEmail().toLowerCase());
        }
        user.setRegisteredSource(registrationRequest.getPlatform() != null ? registrationRequest.getPlatform() : RegisteredSource.NONE);

        Instant instant = Instant.now();
        user.setCreatedAt(instant);
        user.setUpdatedAt(instant);
        user.setLastLoginAt(instant);
        user.setAccountEnabled(true);
        user.setAccountLocked(false);
        user.setEmailVerified(false);
        user.setTermPolicyViewed(false);
        User userDb = userRepository.save(user);
        userDb.setRootId(userDb.getId());
        updateUser(userDb);
        return userDb;
    }

    public void updateUser(User user) {
        userRepository.saveAndFlush(user);
    }


    private Set<Role> fetchRolesFor(RoleName roleName) {
        return roleRepository.findAllByNameIn(roleName);
    }

    @Async("mailExecutor")
    @Override
    public void invokeSignUpEmail(User user, EmailType emailType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        EmailServiceRequest emailServiceRequest = new EmailServiceRequest();
        emailServiceRequest.setUserName(user.getFullName() == null ? "User" : user.getFullName());
        emailServiceRequest.setTo(user.getEmail());
        if (emailType.equals(EmailType.SIGNUP)) {
            emailServiceRequest.setSubject("Welcome mail");
        } else if (emailType.equals(EmailType.VERIFY)) {
            emailServiceRequest.setSubject("Email Verification link");
        }
        emailServiceRequest.setEmailType(emailType);
        HttpEntity<EmailServiceRequest> entity = new HttpEntity<>(emailServiceRequest, headers);
        try {
            restTemplate.exchange(emailServiceUrl, HttpMethod.POST, entity, Void.class);
        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    @Override
    public User getPrincipal() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return findUserByUserName(userDetails.getUsername());
    }

    @Override
    public User findUserByUserName(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new APIException(ErrorCodesAndMessages.ERROR_MESSAGE_USER_NOT_FOUND, HttpStatus.NOT_ACCEPTABLE, ErrorCodesAndMessages.ERROR_CODE_USER_NOT_FOUND_001));
    }

    @Override
    public void validateLogin(User user) {
        Date lastLoginDate = new Date();
        user.setLastLoginAt(lastLoginDate.toInstant());
        userRepository.save(user);
    }

    @Override
    public Optional<User> findByCountryCodeAndPhoneNumber(String countryCode, String phoneNumber) {
        return userRepository.findByCountryCodeAndPhoneNumber(countryCode, phoneNumber);

    }

    @Override
    public UserResponse getCurrentUserProfile() {

        User user = getPrincipal();

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .countryCode(user.getCountryCode())
                .phoneNumber(user.getPhoneNumber())
                .registeredSource(
                        user.getRegisteredSource() != null
                                ? user.getRegisteredSource().name()
                                : null
                )
                .accountEnabled(user.isAccountEnabled())
                .accountLocked(user.isAccountLocked())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .emailVerified(user.isEmailVerified())
                .termPolicyViewed(user.isTermPolicyViewed())
                .role(
                        user.getRoles() != null && !user.getRoles().isEmpty()
                                ? user.getRoles()
                                .iterator()
                                .next()
                                .getName()
                                .name()
                                : null
                )
                .build();
    }

    @Override
    public UserResponse updateProfile(UpdateProfileRequest request) {

        User user = getPrincipal();

        user.setFullName(request.getFullName());
        user.setCountryCode(request.getCountryCode());
        user.setPhoneNumber(request.getPhoneNumber());

        user.setUpdatedAt(Instant.now());

        userRepository.save(user);

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .countryCode(user.getCountryCode())
                .phoneNumber(user.getPhoneNumber())
                .registeredSource(
                        user.getRegisteredSource() != null
                                ? user.getRegisteredSource().name()
                                : null
                )
                .accountEnabled(user.isAccountEnabled())
                .accountLocked(user.isAccountLocked())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .emailVerified(user.isEmailVerified())
                .termPolicyViewed(user.isTermPolicyViewed())
                .role(
                        user.getRoles() != null && !user.getRoles().isEmpty()
                                ? user.getRoles()
                                .iterator()
                                .next()
                                .getName()
                                .name()
                                : null
                )
                .build();
    }

}
