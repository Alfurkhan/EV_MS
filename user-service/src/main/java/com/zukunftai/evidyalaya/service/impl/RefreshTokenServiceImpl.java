package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.exception.ErrorCodesAndMessages;
import com.zukunftai.evidyalaya.repository.UserRepository;
import com.zukunftai.evidyalaya.database.RefreshToken;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.repository.RefreshTokenRepository;
import com.zukunftai.evidyalaya.service.RefreshTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenServiceImpl implements RefreshTokenService {

    @Value("${application.security.jwt.refreshTokenExpirationInMs}")
    private long expiryMilliSeconds;

    private RefreshTokenRepository refreshTokenRepository;
    private UserRepository userRepository;

    @Autowired
    public RefreshTokenServiceImpl(RefreshTokenRepository refreshTokenRepository,
                                   UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }


    public RefreshToken createRefreshToken(User user){
        //check user is exist or not
        Optional<RefreshToken> refreshToken = findByUser(user);
        if(refreshToken.isPresent()){
            RefreshToken updateRefreshToken = refreshToken.get();
            updateRefreshToken.setExpiredAt(Instant.now().plusMillis(expiryMilliSeconds));
            updateRefreshToken.setRefreshToken(UUID.randomUUID().toString());
            return refreshTokenRepository.save(updateRefreshToken);
        }else{
            RefreshToken createRefreshToken = RefreshToken.builder()
                    .user(user)
                    .refreshToken(UUID.randomUUID().toString())
                    .expiredAt(Instant.now().plusMillis(expiryMilliSeconds)) // set expiry of refresh token to 10 minutes - you can configure it application.properties file
                    .build();
            return refreshTokenRepository.save(createRefreshToken);
        }
    }



    public Optional<RefreshToken> findByToken(String token){
        return refreshTokenRepository.findByRefreshToken(token);
    }

    public Optional<RefreshToken> findByUser(User user){
        return refreshTokenRepository.findByUser(user);
    }

    public RefreshToken verifyExpiration(RefreshToken token){
        if(token.getExpiredAt().compareTo(Instant.now())<0){
           // refreshTokenRepository.delete(token);
            new APIException(ErrorCodesAndMessages.ERROR_MESSAGE_USER_REFRESH_TOKEN_EXPIRED_001, HttpStatus.NOT_ACCEPTABLE, ErrorCodesAndMessages.ERROR_CODE_USER_REFRESH_TOKEN_EXPIRED_001);
           // throw new RuntimeException(token.getRefreshToken() + " Refresh token is expired. Please make a new login..!");
        }
        return token;
    }

}
