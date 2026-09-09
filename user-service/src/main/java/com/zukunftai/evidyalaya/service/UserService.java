package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.model.*;

import java.util.Optional;
import java.util.List;

public interface UserService{
    EmailCheckResponse checkUserExists(EmailCheckRequest request);

    default User createUser(EmailSignUpRequest registrationRequest) {
        return null;
    }

    User getPrincipal();
    User findUserByUserName(String username);
    void invokeSignUpEmail(User user, EmailType emailType, String otp);
    void invokeRegistrationOtpEmail(String email, String otp);
    void invokeForgotPasswordEmail(User user, String otp);
    void validateLogin(User user);
    Optional<User> findByCountryCodeAndPhoneNumber(String countryCode, String phoneNumber);

    UserResponse getCurrentUserProfile();
    UserResponse updateProfile(UpdateProfileRequest request);
    void acceptTermsAndConditions();

    List<FacultyResponse> getAllFaculties();
    List<StudentResponse> getAllStudents();

    User createStudentByAdmin(AdminStudentRequest request);

    UserResponse updateStudentByAdmin(
            Long studentId,
            UpdateStudentRequest request
    );

    void disableStudent(Long studentId);

    void enableStudent(Long studentId);

    void lockStudent(Long studentId);

    void unlockStudent(Long studentId);

    void deleteStudent(Long studentId);
}
