package com.zukunftai.evidyalaya.service;


import com.zukunftai.evidyalaya.config.UserPrincipal;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.exception.ErrorCodesAndMessages;
import com.zukunftai.evidyalaya.repository.UserRepository;
import com.zukunftai.evidyalaya.database.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String userName)
            throws UsernameNotFoundException {
        // Let people login with either username or email

        User user = null;
        try {
            user = userRepository.findByUsername(userName)
                    .orElseThrow(() ->
                            new UsernameNotFoundException("User not found with username  " + userName)
                    );

        } catch (Exception e) {
            user = userRepository.findByEmail(userName)
                    .orElseThrow(() ->
                            new UsernameNotFoundException("User not found with email  " + userName)
                    );
        }

        if(user == null) {
            throw new APIException(ErrorCodesAndMessages.ERROR_MESSAGE_USER_NOT_FOUND, HttpStatus.BAD_REQUEST, ErrorCodesAndMessages.ERROR_CODE_USER_NOT_FOUND);
        }

        return UserPrincipal.create(user);
    }

    // This method is used by JWTAuthenticationFilter
    @Transactional
    public UserDetails loadUserById(Long id) {
        User user = userRepository.findById(id).orElseThrow(
                () -> new UsernameNotFoundException("User not found with id : " + id)
        );

        return UserPrincipal.create(user);
    }

    // This method is used by JWTAuthenticationFilter
    @Transactional
    public UserDetails loadUserByPhoneNumber(String countryCode, String phoneNumber) {
        User user = userRepository.findByCountryCodeAndPhoneNumber(countryCode, phoneNumber).orElseThrow(
                () -> new APIException(ErrorCodesAndMessages.ERROR_MESSAGE_USER_PHONE_NUMBER_NOT_FOUND +": "+ phoneNumber, HttpStatus.BAD_REQUEST, ErrorCodesAndMessages.ERROR_CODE_USER_PHONE_NUMBER_NOT_FOUND)
        );
        return UserPrincipal.create(user);

    }

}
