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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import com.zukunftai.evidyalaya.database.User;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;

import jakarta.validation.Valid;

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

    @PostMapping("/faculties")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacultyResponse> createFaculty(
            @Valid @RequestBody AdminFacultyRequest request) {

        User user =
                userService.createFacultyByAdmin(request);

        FacultyResponse response =
                FacultyResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .countryCode(user.getCountryCode())
                        .phoneNumber(user.getPhoneNumber())
                        .accountEnabled(user.isAccountEnabled())
                        .accountLocked(user.isAccountLocked())
                        .emailVerified(user.isEmailVerified())
                        .build();

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/faculties/{facultyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateFaculty(
            @PathVariable Long facultyId,
            @Valid @RequestBody UpdateFacultyRequest request) {

        return ResponseEntity.ok(
                userService.updateFacultyByAdmin(
                        facultyId,
                        request
                )
        );
    }

    @PutMapping("/faculties/{facultyId}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> disableFaculty(
            @PathVariable Long facultyId) {

        userService.disableFaculty(facultyId);

        return ResponseEntity.ok().build();
    }

    @PutMapping("/faculties/{facultyId}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> enableFaculty(
            @PathVariable Long facultyId) {

        userService.enableFaculty(facultyId);

        return ResponseEntity.ok().build();
    }

    @PutMapping("/faculties/{facultyId}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> lockFaculty(
            @PathVariable Long facultyId) {

        userService.lockFaculty(facultyId);

        return ResponseEntity.ok().build();
    }

    @PutMapping("/faculties/{facultyId}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> unlockFaculty(
            @PathVariable Long facultyId) {

        userService.unlockFaculty(facultyId);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/faculties/{facultyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFaculty(
            @PathVariable Long facultyId) {

        userService.deleteFaculty(facultyId);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StudentResponse>> getStudents() {

        return ResponseEntity.ok(
                userService.getAllStudents()
        );
    }

    @PostMapping("/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentResponse> createStudent(
            @Valid @RequestBody AdminStudentRequest request) {

        User user =
                userService.createStudentByAdmin(request);

        StudentResponse response =
                StudentResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .countryCode(user.getCountryCode())
                        .phoneNumber(user.getPhoneNumber())
                        .accountEnabled(user.isAccountEnabled())
                        .accountLocked(user.isAccountLocked())
                        .emailVerified(user.isEmailVerified())
                        .build();

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/students/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateStudent(
            @PathVariable Long studentId,
            @Valid @RequestBody UpdateStudentRequest request) {

        return ResponseEntity.ok(
                userService.updateStudentByAdmin(
                        studentId,
                        request
                )
        );
    }

    @PutMapping("/students/{studentId}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> disableStudent(
            @PathVariable Long studentId) {

        userService.disableStudent(studentId);

        return ResponseEntity.ok().build();
    }


    @PutMapping("/students/{studentId}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> enableStudent(
            @PathVariable Long studentId) {

        userService.enableStudent(studentId);

        return ResponseEntity.ok().build();
    }

    @PutMapping("/students/{studentId}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> lockStudent(
            @PathVariable Long studentId) {

        userService.lockStudent(studentId);

        return ResponseEntity.ok().build();
    }


    @PutMapping("/students/{studentId}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> unlockStudent(
            @PathVariable Long studentId) {

        userService.unlockStudent(studentId);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/students/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteStudent(
            @PathVariable Long studentId
    ) {
        userService.deleteStudent(studentId);
        return ResponseEntity.noContent().build();
    }
}
