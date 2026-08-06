package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.config.JwtTokenProvider;
import com.zukunftai.evidyalaya.config.UserPrincipal;
import com.zukunftai.evidyalaya.database.RefreshToken;
import com.zukunftai.evidyalaya.database.Role;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.exception.ErrorCodesAndMessages;
import com.zukunftai.evidyalaya.model.*;
import com.zukunftai.evidyalaya.service.CustomUserDetailsService;
import com.zukunftai.evidyalaya.service.RefreshTokenService;
import com.zukunftai.evidyalaya.service.UserService;
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

import java.util.*;
import java.util.stream.Collectors;

import static com.zukunftai.evidyalaya.exception.ErrorCodesAndMessages.ERROR_CODE_AUTHENTICATION_FAILED;
import static com.zukunftai.evidyalaya.exception.ErrorCodesAndMessages.ERROR_MESSAGE_AUTHENTICATION_FAILED;

@Slf4j
@RestController
@RequestMapping(path = "/user", produces = "application/json")
@Validated
public class UserController {

    private final UserService userService;

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> profile() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        return ResponseEntity.ok(
                Map.of(
                        "id", userPrincipal.getId(),
                        "name", userPrincipal.getName(),
                        "username", userPrincipal.getUsername(),
                        "email", userPrincipal.getEmail(),
                        "roles", userPrincipal.getAuthorities()
                )
        );
    }
}
