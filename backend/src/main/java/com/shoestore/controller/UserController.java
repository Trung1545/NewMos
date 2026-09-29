package com.shoestore.controller;

import com.shoestore.dto.request.ChangePasswordRequest;
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
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "Các API quản lý thông tin tài khoản người dùng")
public class UserController {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void fixAvatarUrlColumn() {
        try {
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;");
        } catch (Exception ignored) {
            // Đã là kiểu TEXT hoặc database dialect khác
        }
    }

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
    @Operation(summary = "Cập nhật họ tên, số điện thoại, ngày sinh, giới tính hoặc địa chỉ mặc định")
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
            user.setAvatarUrl(processAvatarUrl(user.getId(), request.getAvatarUrl()));
        }

        if (request.getGender() != null) {
            user.setGender(request.getGender().trim());
        }

        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth().trim());
        }

        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin tài khoản thành công!", userMapper.toResponse(savedUser)));
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Tải lên tệp ảnh đại diện cho người dùng")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadAvatar(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam("file") MultipartFile file
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để cập nhật ảnh đại diện"));
        }

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn tập tin ảnh hợp lệ!");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "png";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        }

        String fileName = "avatar_" + userDetails.getId() + "_" + System.currentTimeMillis() + "." + extension;

        try {
            saveToFileSystem(fileName, file.getBytes());
        } catch (Exception e) {
            throw new BadRequestException("Lỗi khi lưu ảnh đại diện: " + e.getMessage());
        }

        String avatarUrl = "/images/avatars/" + fileName;

        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userDetails.getId()));
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("Tải ảnh đại diện thành công!", Map.of("avatarUrl", avatarUrl)));
    }

    private String processAvatarUrl(Long userId, String rawAvatarUrl) {
        if (rawAvatarUrl == null || rawAvatarUrl.isBlank()) {
            return null;
        }
        String trimmed = rawAvatarUrl.trim();
        // Nếu là data URI base64: data:image/...;base64,...
        if (trimmed.startsWith("data:image/")) {
            try {
                int commaIndex = trimmed.indexOf(',');
                if (commaIndex != -1) {
                    String metadata = trimmed.substring(0, commaIndex);
                    String base64Data = trimmed.substring(commaIndex + 1);

                    String extension = "png";
                    if (metadata.contains("image/jpeg") || metadata.contains("image/jpg")) {
                        extension = "jpg";
                    } else if (metadata.contains("image/webp")) {
                        extension = "webp";
                    }

                    byte[] decodedBytes = Base64.getDecoder().decode(base64Data);
                    String fileName = "avatar_" + userId + "_" + System.currentTimeMillis() + "." + extension;

                    saveToFileSystem(fileName, decodedBytes);
                    return "/images/avatars/" + fileName;
                }
            } catch (Exception e) {
                // Fallback nếu có lỗi giải mã
            }
        }
        return trimmed;
    }

    private void saveToFileSystem(String fileName, byte[] data) {
        try {
            // 1. Lưu vào thư mục uploads/images/avatars
            Path uploadDir = Paths.get("uploads", "images", "avatars");
            Files.createDirectories(uploadDir);
            Files.write(uploadDir.resolve(fileName), data);

            // 2. Lưu đồng thời vào thư mục frontend/public/images/avatars (nếu có)
            Path frontendDir = Paths.get("..", "frontend", "public", "images", "avatars");
            if (Files.exists(frontendDir.getParent())) {
                Files.createDirectories(frontendDir);
                Files.write(frontendDir.resolve(fileName), data);
            }
        } catch (Exception ex) {
            System.err.println("Không thể lưu file avatar vào ổ đĩa: " + ex.getMessage());
        }
    }

    @PostMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu tài khoản người dùng")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để đổi mật khẩu"));
        }

        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userDetails.getId()));

        // 1. Kiểm tra mật khẩu hiện tại
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác!");
        }

        // 2. Kiểm tra mật khẩu xác nhận
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không trùng khớp!");
        }

        // 3. Mật khẩu mới không được trùng mật khẩu cũ
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu mới không được trùng với mật khẩu hiện tại!");
        }

        // 4. Lưu mật khẩu mới đã mã hóa
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.", null));
    }
}
