package com.shoestore.controller;

import com.shoestore.dto.request.UpdateProfileRequest;
import com.shoestore.dto.response.ApiResponse;
import com.shoestore.dto.response.UserResponse;
import com.shoestore.entity.User;
import com.shoestore.exception.BadRequestException;
import com.shoestore.exception.ResourceNotFoundException;
import com.shoestore.mapper.UserMapper;
import com.shoestore.repository.UserRepository;
import com.shoestore.security.service.UserDetailsImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "Các API quản lý thông tin tài khoản người dùng")
public class UserController {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @GetMapping("/profile")
    @Operation(summary = "Lấy thông tin tài khoản người dùng hiện tại")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để xem thông tin"));
        }

        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userDetails.getId()));

        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tài khoản thành công!", userMapper.toResponse(user)));
    }

    @PutMapping("/profile")
    @Operation(summary = "Cập nhật họ tên, số điện thoại hoặc địa chỉ mặc định")
    @Transactional
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để cập nhật"));
        }

        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userDetails.getId()));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String newPhone = request.getPhone().trim();
            if (!newPhone.equals(user.getPhone()) && userRepository.existsByPhone(newPhone)) {
                throw new BadRequestException("Số điện thoại này đã được sử dụng bởi tài khoản khác!");
            }
            user.setPhone(newPhone);
        }

        if (request.getAddress() != null) {
            user.setAddress(request.getAddress().trim());
        }

        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin tài khoản thành công!", userMapper.toResponse(savedUser)));
    }
}
