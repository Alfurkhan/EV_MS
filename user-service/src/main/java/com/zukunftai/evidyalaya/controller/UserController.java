package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.model.*;
import com.zukunftai.evidyalaya.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.zukunftai.evidyalaya.model.UpdateProfileRequest;
import com.zukunftai.evidyalaya.model.UserResponse;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.model.FacultyResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

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
    public ResponseEntity<UserResponse> profile() {

        User user = userService.getPrincipal();

        String role = user.getRoles()
                .stream()
                .findFirst()
                .map(roleEntity -> roleEntity.getName().name())
                .orElse(null);

        UserResponse response = UserResponse.builder()
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
                .role(role)
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @RequestBody UpdateProfileRequest request) {

        return ResponseEntity.ok(
                userService.updateProfile(request)
        );

    }

    @PutMapping("/terms/accept")
    public ResponseEntity<Void> acceptTermsAndConditions() {

        userService.acceptTermsAndConditions();

        return ResponseEntity.ok().build();
    }

    @GetMapping("/faculties")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FacultyResponse>> getFaculties() {

        return ResponseEntity.ok(
                userService.getAllFaculties()
        );
    }

    @GetMapping("/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StudentResponse>> getStudents() {

        return ResponseEntity.ok(
                userService.getAllStudents()
        );
    }
}
