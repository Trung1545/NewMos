package com.shoestore.service.impl;

import com.shoestore.dto.request.LoginRequest;
import com.shoestore.dto.request.RegisterRequest;
import com.shoestore.dto.response.AuthResponse;
import com.shoestore.dto.response.UserResponse;
import com.shoestore.entity.Role;
import com.shoestore.entity.User;
import com.shoestore.enums.RoleType;
import com.shoestore.exception.BadRequestException;
import com.shoestore.exception.ResourceNotFoundException;
import com.shoestore.mapper.UserMapper;
import com.shoestore.repository.RoleRepository;
import com.shoestore.repository.UserRepository;
import com.shoestore.security.jwt.JwtUtils;
import com.shoestore.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserMapper userMapper;

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getIdentifier(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String accessToken = jwtUtils.generateAccessToken(authentication);

        User user = userRepository.findByIdentifier(request.getIdentifier())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "identifier", request.getIdentifier()));

        String refreshToken = jwtUtils.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userMapper.toResponse(user))
                .build();
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Địa chỉ email đã được đăng ký trong hệ thống!");
        }

        if (request.getPhone() != null && !request.getPhone().isBlank() && userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("Số điện thoại này đã được sử dụng!");
        }

        Role userRole = roleRepository.findByName(RoleType.ROLE_USER)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(RoleType.ROLE_USER)
                        .description("Quyền khách hàng mua sắm tiêu chuẩn")
                        .build()));

        User newUser = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .isActive(true)
                .roles(Collections.singleton(userRole))
                .build();

        User savedUser = userRepository.save(newUser);

        String userRoleStr = userRole.getName().name();
        String accessToken = jwtUtils.generateAccessToken(savedUser.getEmail(), userRoleStr);
        String refreshToken = jwtUtils.generateRefreshToken(savedUser.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userMapper.toResponse(savedUser))
                .build();
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtUtils.validateJwtToken(refreshToken)) {
            throw new BadRequestException("Refresh token không hợp lệ hoặc đã hết hạn!");
        }

        String username = jwtUtils.getUserNameFromJwtToken(refreshToken);
        User user = userRepository.findByIdentifier(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "username", username));

        String newAccessToken = jwtUtils.generateAccessToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userMapper.toResponse(user))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BadRequestException("Người dùng chưa đăng nhập!");
        }

        String identifier = authentication.getName();
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "identifier", identifier));

        return userMapper.toResponse(user);
    }
}
