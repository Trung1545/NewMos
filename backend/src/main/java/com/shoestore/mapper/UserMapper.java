package com.shoestore.mapper;

import com.shoestore.dto.response.UserResponse;
import com.shoestore.entity.User;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        if (user == null) return null;

        Set<String> roles = user.getRoles() != null
                ? user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet())
                : Collections.emptySet();

        String primaryRole = roles.stream()
                .filter(r -> r.equals("ROLE_ADMIN"))
                .findFirst()
                .orElse(roles.isEmpty() ? "ROLE_USER" : roles.iterator().next());

        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .avatarUrl(user.getAvatarUrl())
                .gender(user.getGender())
                .dateOfBirth(user.getDateOfBirth())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .roles(roles)
                .role(primaryRole)
                .build();
    }
}
