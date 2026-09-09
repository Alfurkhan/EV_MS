package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.config.JwtTokenProvider;
import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.exception.ErrorCodesAndMessages;
import com.zukunftai.evidyalaya.model.*;
import com.zukunftai.evidyalaya.repository.*;
import com.zukunftai.evidyalaya.service.*;
import com.zukunftai.evidyalaya.service.CustomUserDetailsService;
import com.zukunftai.evidyalaya.service.RefreshTokenService;
import com.zukunftai.evidyalaya.service.UserService;
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
    private final EmailRegistrationOtpService emailRegistrationOtpService;

    @Autowired
    public UserServiceImpl(CustomUserDetailsService customUserDetailsService,
                           RoleRepository roleRepository,
                           UserRepository userRepository,
                           EmailRegistrationOtpService emailRegistrationOtpService,
                           PasswordEncoder passwordEncoder,
                           RestTemplate restTemplate,
                           RefreshTokenRepository refreshTokenRepository,
                           AuthenticationManager authenticationManager,
                           JwtTokenProvider jwtTokenProvider,
                           RefreshTokenService refreshTokenService) {
        this.customUserDetailsService = customUserDetailsService;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.emailRegistrationOtpService = emailRegistrationOtpService;
        this.passwordEncoder = passwordEncoder;
        this.restTemplate = restTemplate;
        this.refreshTokenRepository = refreshTokenRepository;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
    }

    @Override
    public EmailCheckResponse checkUserExists(
            EmailCheckRequest request
    ) {

        Optional<User> user =
                userRepository.findByUsername(
                        request.getEmail()
                );

        if (user.isPresent()) {

            String role =
                    user.get()
                            .getRoles()
                            .stream()
                            .findFirst()
                            .map(userRole ->
                                    userRole
                                            .getName()
                                            .name()
                            )
                            .orElse(null);

            return new EmailCheckResponse(
                    true,
                    role
            );
        }

        return new EmailCheckResponse(
                false,
                null
        );
    }

    @Transactional
    @Override
    public User createUser(EmailSignUpRequest registrationRequest) {

        String email = registrationRequest.getEmail().toLowerCase().trim();

        EmailRegistrationOtp verifiedOtp =
                emailRegistrationOtpService
                        .getVerifiedOtpForRegistration(email);

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
        User user = new User(
                email,
                email,
                registrationRequest.getPassword()
        );
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRoles(roles);
        user.setFullName(registrationRequest.getFullName());

        user.setCountryCode(registrationRequest.getCountryCode());
        user.setPhoneNumber(registrationRequest.getPhoneNumber());

        user.setRegisteredSource(registrationRequest.getPlatform() != null ? registrationRequest.getPlatform() : RegisteredSource.NONE);

        Instant instant = Instant.now();
        user.setCreatedAt(instant);
        user.setUpdatedAt(instant);
        user.setLastLoginAt(instant);
        user.setAccountEnabled(true);
        user.setAccountLocked(false);
        user.setEmailVerified(true);
        user.setTermPolicyViewed(false);
        User userDb = userRepository.save(user);
        userDb.setRootId(userDb.getId());
        updateUser(userDb);

        // Consume the verified registration OTP.
        emailRegistrationOtpService.consumeOtp(verifiedOtp.getId());

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
    public void invokeSignUpEmail(User user, EmailType emailType, String otp) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        EmailServiceRequest emailServiceRequest =
                new EmailServiceRequest();

        emailServiceRequest.setUserName(
                user.getFullName() == null
                        ? "User"
                        : user.getFullName()
        );

        emailServiceRequest.setTo(user.getEmail());

        if (emailType.equals(EmailType.SIGNUP)) {

            emailServiceRequest.setSubject("Welcome mail");

        } else if (emailType.equals(EmailType.VERIFY)) {

            emailServiceRequest.setSubject("Email Verification OTP");
        }

        emailServiceRequest.setEmailType(emailType);
        emailServiceRequest.setOtp(otp);

        HttpEntity<EmailServiceRequest> entity =
                new HttpEntity<>(emailServiceRequest, headers);

        try {

            restTemplate.exchange(
                    emailServiceUrl,
                    HttpMethod.POST,
                    entity,
                    Void.class
            );

        } catch (Exception e) {

            log.error(
                    "Failed to send email to {}",
                    user.getEmail(),
                    e
            );
        }
    }

    @Async("mailExecutor")
    @Override
    public void invokeRegistrationOtpEmail(String email, String otp) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        EmailServiceRequest emailServiceRequest =
                new EmailServiceRequest();

        emailServiceRequest.setUserName("User");
        emailServiceRequest.setTo(email);
        emailServiceRequest.setSubject("Email Verification OTP");
        emailServiceRequest.setEmailType(EmailType.VERIFY);
        emailServiceRequest.setOtp(otp);

        HttpEntity<EmailServiceRequest> entity =
                new HttpEntity<>(emailServiceRequest, headers);

        try {

            restTemplate.exchange(
                    emailServiceUrl,
                    HttpMethod.POST,
                    entity,
                    Void.class
            );

        } catch (Exception e) {

            log.error(
                    "Failed to send registration OTP to {}",
                    email,
                    e
            );
        }
    }

    @Async("mailExecutor")
    @Override
    public void invokeForgotPasswordEmail(User user, String otp) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        EmailServiceRequest emailServiceRequest =
                new EmailServiceRequest();

        emailServiceRequest.setUserName(
                user.getFullName() == null
                        ? "User"
                        : user.getFullName()
        );

        emailServiceRequest.setTo(user.getEmail());

        emailServiceRequest.setSubject(
                "Password Reset OTP"
        );

        emailServiceRequest.setEmailType(
                EmailType.FORGOT_PASSWORD
        );

        emailServiceRequest.setOtp(otp);

        HttpEntity<EmailServiceRequest> entity =
                new HttpEntity<>(
                        emailServiceRequest,
                        headers
                );

        try {

            restTemplate.exchange(
                    emailServiceUrl,
                    HttpMethod.POST,
                    entity,
                    Void.class
            );

        } catch (Exception e) {

            log.error(
                    "Failed to send password reset OTP to {}",
                    user.getEmail(),
                    e
            );
        }
    }

    @Override
    public User getPrincipal() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated() ||
                authentication instanceof AnonymousAuthenticationToken) {

            throw new APIException(
                    "User is not authenticated.",
                    HttpStatus.UNAUTHORIZED,
                    "USER_NOT_AUTHENTICATED"
            );
        }

        Object principal = authentication.getPrincipal();

        String username;

        if (principal instanceof UserDetails userDetails) {
            username = userDetails.getUsername();
        } else if (principal instanceof String principalString) {
            username = principalString;
        } else {
            throw new APIException(
                    "Unable to determine authenticated user.",
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_AUTHENTICATION_PRINCIPAL"
            );
        }

        return findUserByUserName(username);
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
    @Transactional
    public void acceptTermsAndConditions() {

        User user = getPrincipal();

        if (!user.isTermPolicyViewed()) {

            user.setTermPolicyViewed(true);

            user.setUpdatedAt(Instant.now());

            userRepository.save(user);
        }
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

    @Override
    @Transactional(readOnly = true)
    public List<FacultyResponse> getAllFaculties() {

        return userRepository.findAll()
                .stream()
                .filter(user ->
                        user.getRoles() != null &&
                                user.getRoles()
                                        .stream()
                                        .anyMatch(role ->
                                                role.getName() == RoleName.ROLE_FACULTY
                                        )
                )
                .map(user ->
                        FacultyResponse.builder()
                                .id(user.getId())
                                .fullName(user.getFullName())
                                .email(user.getEmail())
                                .build()
                )
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentResponse> getAllStudents() {

        return userRepository.findAll()
                .stream()
                .filter(user ->
                        !user.isAccountDeleted() &&
                                user.getRoles() != null &&
                                user.getRoles()
                                        .stream()
                                        .anyMatch(role ->
                                                role.getName() == RoleName.ROLE_STUDENT
                                        )
                )
                .map(user ->
                        StudentResponse.builder()
                                .id(user.getId())
                                .fullName(user.getFullName())
                                .email(user.getEmail())
                                .countryCode(user.getCountryCode())
                                .phoneNumber(user.getPhoneNumber())
                                .accountEnabled(user.isAccountEnabled())
                                .accountLocked(user.isAccountLocked())
                                .emailVerified(user.isEmailVerified())
                                .build()
                )
                .toList();
    }

    @Override
    @Transactional
    public User createStudentByAdmin(AdminStudentRequest request) {

        String email = request.getEmail()
                .toLowerCase()
                .trim();

        // Prevent duplicate accounts.
        if (userRepository.findByUsername(email).isPresent()) {
            throw new APIException(
                    "A user with this email already exists.",
                    HttpStatus.CONFLICT,
                    "USER_ALREADY_EXISTS"
            );
        }

        // Validate full name.
        String fullName = request.getFullName().trim();

        if (fullName.length() < 4) {
            throw new APIException(
                    ErrorCodesAndMessages.ERROR_CODE_INVALID_FULL_NAME,
                    HttpStatus.BAD_REQUEST,
                    ErrorCodesAndMessages.ERROR_MESSAGE_INVALID_FULL_NAME
            );
        }

        if (!fullName.matches("^[A-Za-z ]+$")) {
            throw new APIException(
                    ErrorCodesAndMessages.ERROR_CODE_INVALID_FULL_NAME,
                    HttpStatus.BAD_REQUEST,
                    ErrorCodesAndMessages.ERROR_MESSAGE_INVALID_FULL_NAME
            );
        }

        // Get the student role.
        Set<Role> roles =
                fetchRolesFor(RoleName.ROLE_STUDENT);

        if (roles == null || roles.isEmpty()) {
            throw new APIException(
                    "Student role is not configured.",
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "STUDENT_ROLE_NOT_FOUND"
            );
        }

        // Create the user.
        User user = new User(
                email,
                email,
                request.getPassword()
        );

        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        user.setRoles(roles);
        user.setFullName(fullName);

        user.setCountryCode(request.getCountryCode());
        user.setPhoneNumber(request.getPhoneNumber());

        user.setRegisteredSource(
                RegisteredSource.NONE
        );

        Instant instant = Instant.now();

        user.setCreatedAt(instant);
        user.setUpdatedAt(instant);
        user.setLastLoginAt(instant);

        user.setAccountEnabled(true);
        user.setAccountLocked(false);

        // Admin-created students don't need registration OTP verification.
        user.setEmailVerified(true);

        user.setTermPolicyViewed(false);

        User savedUser =
                userRepository.save(user);

        savedUser.setRootId(
                savedUser.getId()
        );

        updateUser(savedUser);

        return savedUser;
    }

    @Override
    @Transactional
    public UserResponse updateStudentByAdmin(
            Long studentId,
            UpdateStudentRequest request) {

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new APIException(
                        "Student not found.",
                        HttpStatus.NOT_FOUND,
                        "STUDENT_NOT_FOUND"
                ));

        boolean isStudent = student.getRoles()
                .stream()
                .anyMatch(role ->
                        role.getName() == RoleName.ROLE_STUDENT
                );

        if (!isStudent) {
            throw new APIException(
                    "The selected user is not a student.",
                    HttpStatus.BAD_REQUEST,
                    "USER_IS_NOT_STUDENT"
            );
        }

        String fullName = request.getFullName().trim();

        if (fullName.length() < 4) {
            throw new APIException(
                    ErrorCodesAndMessages.ERROR_CODE_INVALID_FULL_NAME,
                    HttpStatus.BAD_REQUEST,
                    ErrorCodesAndMessages.ERROR_MESSAGE_INVALID_FULL_NAME
            );
        }

        if (!fullName.matches("^[A-Za-z ]+$")) {
            throw new APIException(
                    ErrorCodesAndMessages.ERROR_CODE_INVALID_FULL_NAME,
                    HttpStatus.BAD_REQUEST,
                    ErrorCodesAndMessages.ERROR_MESSAGE_INVALID_FULL_NAME
            );
        }

        student.setFullName(fullName);
        student.setCountryCode(request.getCountryCode());
        student.setPhoneNumber(request.getPhoneNumber());
        student.setUpdatedAt(Instant.now());

        User savedStudent = userRepository.save(student);

        String role = savedStudent.getRoles()
                .stream()
                .findFirst()
                .map(roleEntity -> roleEntity.getName().name())
                .orElse(null);

        return UserResponse.builder()
                .id(savedStudent.getId())
                .username(savedStudent.getUsername())
                .fullName(savedStudent.getFullName())
                .email(savedStudent.getEmail())
                .countryCode(savedStudent.getCountryCode())
                .phoneNumber(savedStudent.getPhoneNumber())
                .registeredSource(
                        savedStudent.getRegisteredSource() != null
                                ? savedStudent.getRegisteredSource().name()
                                : null
                )
                .accountEnabled(savedStudent.isAccountEnabled())
                .accountLocked(savedStudent.isAccountLocked())
                .createdAt(savedStudent.getCreatedAt())
                .updatedAt(savedStudent.getUpdatedAt())
                .lastLoginAt(savedStudent.getLastLoginAt())
                .emailVerified(savedStudent.isEmailVerified())
                .termPolicyViewed(savedStudent.isTermPolicyViewed())
                .role(role)
                .build();
    }

    @Override
    @Transactional
    public void disableStudent(Long studentId) {

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new APIException(
                        "Student not found.",
                        HttpStatus.NOT_FOUND,
                        "STUDENT_NOT_FOUND"
                ));

        boolean isStudent = student.getRoles()
                .stream()
                .anyMatch(role ->
                        role.getName() == RoleName.ROLE_STUDENT
                );

        if (!isStudent) {
            throw new APIException(
                    "The selected user is not a student.",
                    HttpStatus.BAD_REQUEST,
                    "USER_IS_NOT_STUDENT"
            );
        }

        if (!student.isAccountEnabled()) {
            throw new APIException(
                    "Student account is already disabled.",
                    HttpStatus.CONFLICT,
                    "STUDENT_ALREADY_DISABLED"
            );
        }

        student.setAccountEnabled(false);
        student.setUpdatedAt(Instant.now());

        userRepository.save(student);
    }


    @Override
    @Transactional
    public void enableStudent(Long studentId) {

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new APIException(
                        "Student not found.",
                        HttpStatus.NOT_FOUND,
                        "STUDENT_NOT_FOUND"
                ));

        boolean isStudent = student.getRoles()
                .stream()
                .anyMatch(role ->
                        role.getName() == RoleName.ROLE_STUDENT
                );

        if (!isStudent) {
            throw new APIException(
                    "The selected user is not a student.",
                    HttpStatus.BAD_REQUEST,
                    "USER_IS_NOT_STUDENT"
            );
        }

        if (student.isAccountEnabled()) {
            throw new APIException(
                    "Student account is already enabled.",
                    HttpStatus.CONFLICT,
                    "STUDENT_ALREADY_ENABLED"
            );
        }

        student.setAccountEnabled(true);
        student.setUpdatedAt(Instant.now());

        userRepository.save(student);
    }

    @Override
    @Transactional
    public void lockStudent(Long studentId) {

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new APIException(
                        "Student not found.",
                        HttpStatus.NOT_FOUND,
                        "STUDENT_NOT_FOUND"
                ));

        boolean isStudent = student.getRoles()
                .stream()
                .anyMatch(role ->
                        role.getName() == RoleName.ROLE_STUDENT
                );

        if (!isStudent) {
            throw new APIException(
                    "The selected user is not a student.",
                    HttpStatus.BAD_REQUEST,
                    "USER_IS_NOT_STUDENT"
            );
        }

        if (student.isAccountLocked()) {
            throw new APIException(
                    "Student account is already locked.",
                    HttpStatus.CONFLICT,
                    "STUDENT_ALREADY_LOCKED"
            );
        }

        student.setAccountLocked(true);
        student.setUpdatedAt(Instant.now());

        userRepository.save(student);
    }


    @Override
    @Transactional
    public void unlockStudent(Long studentId) {

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new APIException(
                        "Student not found.",
                        HttpStatus.NOT_FOUND,
                        "STUDENT_NOT_FOUND"
                ));

        boolean isStudent = student.getRoles()
                .stream()
                .anyMatch(role ->
                        role.getName() == RoleName.ROLE_STUDENT
                );

        if (!isStudent) {
            throw new APIException(
                    "The selected user is not a student.",
                    HttpStatus.BAD_REQUEST,
                    "USER_IS_NOT_STUDENT"
            );
        }

        if (!student.isAccountLocked()) {
            throw new APIException(
                    "Student account is already unlocked.",
                    HttpStatus.CONFLICT,
                    "STUDENT_ALREADY_UNLOCKED"
            );
        }

        student.setAccountLocked(false);
        student.setUpdatedAt(Instant.now());

        userRepository.save(student);
    }

    @Override
    @Transactional
    public void deleteStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new APIException(
                        "Student not found.",
                        HttpStatus.NOT_FOUND,
                        "STUDENT_NOT_FOUND"
                ));

        boolean isStudent = student.getRoles()
                .stream()
                .anyMatch(role ->
                        role.getName() == RoleName.ROLE_STUDENT
                );

        if (!isStudent) {
            throw new APIException(
                    "The selected user is not a student.",
                    HttpStatus.BAD_REQUEST,
                    "USER_IS_NOT_STUDENT"
            );
        }

        if (student.isAccountDeleted()) {
            throw new APIException(
                    "Student account is already deleted.",
                    HttpStatus.CONFLICT,
                    "STUDENT_ALREADY_DELETED"
            );
        }

        student.setAccountDeleted(true);
        student.setAccountEnabled(false);
        student.setAccountLocked(false);
        student.setUpdatedAt(Instant.now());

        userRepository.save(student);
    }
}