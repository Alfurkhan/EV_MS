package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.config.JwtTokenProvider;
import com.zukunftai.evidyalaya.database.RefreshToken;
import com.zukunftai.evidyalaya.database.Role;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.exception.ErrorCodesAndMessages;
import com.zukunftai.evidyalaya.model.*;
import com.zukunftai.evidyalaya.service.*;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.stream.Collectors;

import static com.zukunftai.evidyalaya.exception.ErrorCodesAndMessages.ERROR_CODE_AUTHENTICATION_FAILED;
import static com.zukunftai.evidyalaya.exception.ErrorCodesAndMessages.ERROR_MESSAGE_AUTHENTICATION_FAILED;

@Slf4j
@RestController
@RequestMapping(path = "/auth", produces = "application/json")
@Validated
public class AuthController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;
    private final RefreshTokenService refreshTokenService;
    private final EmailRegistrationOtpService emailRegistrationOtpService;

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    public AuthController(
            UserService userService,
            JwtTokenProvider jwtTokenProvider,
            CustomUserDetailsService customUserDetailsService,
            RefreshTokenService refreshTokenService,
            EmailRegistrationOtpService emailRegistrationOtpService) {

        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.customUserDetailsService = customUserDetailsService;
        this.refreshTokenService = refreshTokenService;
        this.emailRegistrationOtpService = emailRegistrationOtpService;
    }

    @PostMapping("/check/email")
    public ResponseEntity<EmailCheckResponse> checkEmailExistsForUser(@Valid @RequestBody EmailCheckRequest emailCheckRequest) {
        EmailCheckResponse response = userService.checkUserExists(emailCheckRequest);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "User sign-up/register call via email as username and password given while sign-up")

    @PostMapping("/register/user")
    public ResponseEntity<JwtResponse> register(@RequestBody EmailSignUpRequest registerRequest) {

        String email = registerRequest.getEmail().toLowerCase().trim();

        User user = userService.createUser(registerRequest);
        log.info(
                "User registration successful for {}",
                user.getEmail()
        );
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(user.getUsername(), registerRequest.getPassword()));

        if (authentication.isAuthenticated()) {
            SecurityContextHolder.getContext().setAuthentication(authentication);
            Set<RoleName> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
            String jwt = jwtTokenProvider.GenerateToken(user.getUsername(), roles, user);
            JwtAuthentication res = new JwtAuthentication(jwt, roles);

            return ResponseEntity.ok(JwtResponse.builder()
                    .tokenType(res.getTokenType()).accessToken(res.getAccessToken()).roles(roles).expireAt(jwtTokenProvider.extractExpiration(jwt).getTime()).refreshToken(refreshTokenService.createRefreshToken(user).getRefreshToken()).build());
        }

        return new ResponseEntity<>(HttpStatus.NOT_FOUND);

    }

    @Operation(summary = "UI sign-in call via email as username and password given while sign-up",
            description = "Check sign-up stage and get user to next sign-up screens like email verification .. etc")
    @PostMapping("/login")
    public ResponseEntity<JwtResponse> AuthenticateAndGetToken(@Valid @RequestBody AuthRequest authRequest){
        authRequest.setUserName(authRequest.getUserName().toLowerCase());
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            authRequest.getUserName(),
                            authRequest.getPassword()
                    )
            );

            if (authentication.isAuthenticated()) {
                SecurityContextHolder.getContext().setAuthentication(authentication);
                User user = userService.getPrincipal();
                if (!user.isAccountEnabled())
                    throw new APIException(ErrorCodesAndMessages.ERROR_MESSAGE_USER_NOT_ACTIVE_001, HttpStatus.NOT_ACCEPTABLE, ErrorCodesAndMessages.ERROR_CODE_USER_NOT_ACTIVE_001);

                Set<RoleName> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());

                String jwt = jwtTokenProvider.GenerateToken(user.getUsername(), roles, user);
                JwtAuthentication res = new JwtAuthentication(jwt, roles);
                //update user table field last login
                userService.validateLogin(user);
                return ResponseEntity.ok(JwtResponse.builder()
                        .tokenType(res.getTokenType())
                        .accessToken(res.getAccessToken())
                        .roles(roles).expireAt(jwtTokenProvider.extractExpiration(jwt).getTime())
                        .refreshToken(refreshTokenService.createRefreshToken(user).getRefreshToken())
                        .build());
            }
            else return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (BadCredentialsException e) {
            throw new APIException(ErrorCodesAndMessages.ERROR_MESSAGE_BAD_CREDENTIALS,
                    HttpStatus.BAD_REQUEST, ErrorCodesAndMessages.ERROR_CODE_BAD_CREDENTIALS);
        }
        catch(APIException e){
            throw e;
        }
        catch (UsernameNotFoundException e) {
            throw new APIException(ErrorCodesAndMessages.ERROR_MESSAGE_USER_NOT_FOUND,
                    HttpStatus.NOT_FOUND, ErrorCodesAndMessages.ERROR_MESSAGE_USER_NOT_FOUND);
        }catch (Exception e) {
            log.error("Unexpected error: {}", e.getMessage());
            throw new APIException(ERROR_MESSAGE_AUTHENTICATION_FAILED, HttpStatus.EXPECTATION_FAILED,
                    ERROR_CODE_AUTHENTICATION_FAILED);
        }
    }

    @PostMapping("/send/email")
    public ResponseEntity<Void> sendRegistrationOtp(
            @Valid @RequestBody EmailRegistrationOtpRequest request) {

        String email = request.getEmail().toLowerCase().trim();

        String otp =
                emailRegistrationOtpService.generateAndSaveOtp(email);

        userService.invokeRegistrationOtpEmail(email, otp);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/verify-registration-otp")
    public ResponseEntity<Void> verifyRegistrationOtp(
            @Valid @RequestBody EmailRegistrationOtpVerifyRequest request) {

        String email = request.getEmail().toLowerCase().trim();

        emailRegistrationOtpService.verifyOtp(
                email,
                request.getOtp()
        );

        return ResponseEntity.ok().build();
    }

    @PostMapping("/refreshToken")
    public ResponseEntity<JwtResponse> refreshToken(@RequestBody RefreshTokenRequest refreshTokenRequestDTO) {
        RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenRequestDTO.getToken())
                .orElseThrow(() -> new APIException(ErrorCodesAndMessages.ERROR_MESSAGE_USER_REFRESH_TOKEN_NOT_VALID_001, HttpStatus.NOT_ACCEPTABLE, ErrorCodesAndMessages.ERROR_CODE_USER_REFRESH_TOKEN_NOT_VALID_001));

        refreshTokenService.verifyExpiration(refreshToken);
        User user = refreshToken.getUser();
        if (!user.isAccountEnabled() || user.isAccountLocked()) {
            throw new APIException(
                    ErrorCodesAndMessages.ERROR_MESSAGE_USER_NOT_ACTIVE_001,
                    HttpStatus.NOT_ACCEPTABLE,
                    ErrorCodesAndMessages.ERROR_CODE_USER_NOT_ACTIVE_001
            );
        }

        Set<RoleName> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        String jwt = jwtTokenProvider.GenerateToken(user.getUsername(), roles, user);
        JwtAuthentication res = new JwtAuthentication(jwt, roles);
        return ResponseEntity.ok(JwtResponse.builder()
                .tokenType(res.getTokenType()).accessToken(res.getAccessToken()).roles(roles).expireAt(jwtTokenProvider.extractExpiration(jwt).getTime()).refreshToken(refreshTokenService.createRefreshToken(user).getRefreshToken()).build());
    }
}
