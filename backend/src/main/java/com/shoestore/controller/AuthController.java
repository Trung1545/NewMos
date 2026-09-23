package com.shoestore.controller;

import com.shoestore.dto.request.LoginRequest;
import com.shoestore.dto.request.RegisterRequest;
import com.shoestore.dto.response.ApiResponse;
import com.shoestore.dto.response.AuthResponse;
import com.shoestore.dto.response.UserResponse;
import com.shoestore.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Các API xác thực, đăng nhập và đăng ký người dùng")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập tài khoản bằng Email hoặc Số điện thoại")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công!", response));
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản thành viên mới nhận voucher 200.000₫")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo tài khoản thành công!", response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới Access Token khi hết hạn")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@RequestParam String refreshToken) {
        AuthResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công!", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin hồ sơ tài khoản đang đăng nhập")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        UserResponse user = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin thành công!", user));
    }
}
