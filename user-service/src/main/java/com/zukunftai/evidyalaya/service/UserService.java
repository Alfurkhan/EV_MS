package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.model.*;

import java.util.Optional;

public interface UserService{
    EmailCheckResponse checkUserExists(EmailCheckRequest request);

    default User createUser(EmailSignUpRequest registrationRequest) {
        return null;
    }

    User getPrincipal();
    User findUserByUserName(String username);
    void invokeSignUpEmail(User user, EmailType emailType, String otp);
    void invokeRegistrationOtpEmail(String email, String otp);
    void validateLogin(User user);
    Optional<User> findByCountryCodeAndPhoneNumber(String countryCode, String phoneNumber);

    UserResponse getCurrentUserProfile();
    UserResponse updateProfile(UpdateProfileRequest request);
}
