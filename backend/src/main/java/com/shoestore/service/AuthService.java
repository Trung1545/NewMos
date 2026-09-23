package com.shoestore.service;

import com.shoestore.dto.request.LoginRequest;
import com.shoestore.dto.request.RegisterRequest;
import com.shoestore.dto.response.AuthResponse;
import com.shoestore.dto.response.UserResponse;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request);

    AuthResponse refreshToken(String refreshToken);

    UserResponse getCurrentUser();
}
