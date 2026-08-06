package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.RefreshToken;
import com.zukunftai.evidyalaya.database.User;

import java.util.Optional;

public interface RefreshTokenService {
    RefreshToken createRefreshToken(User user);
    Optional<RefreshToken> findByUser(User user);
    Optional<RefreshToken> findByToken(String token);
    RefreshToken verifyExpiration(RefreshToken token);
}
