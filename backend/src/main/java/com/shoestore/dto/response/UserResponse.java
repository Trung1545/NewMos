package com.shoestore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String avatarUrl;
    private String gender;
    private String dateOfBirth;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private Set<String> roles;
    private String role;
}
