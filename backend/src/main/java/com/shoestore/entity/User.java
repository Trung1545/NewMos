package com.shoestore.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Thực thể User đại diện cho người dùng hệ thống (Khách hàng, Nhân viên, Admin).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(name = "uk_users_email", columnNames = "email"),
        @UniqueConstraint(name = "uk_users_phone", columnNames = "phone")
})
public class User extends BaseEntity {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 150, message = "Họ và tên không vượt quá 150 ký tự")
    @Column(name = "full_name", length = 150, nullable = false)
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    @Size(max = 150, message = "Email không vượt quá 150 ký tự")
    @Column(name = "email", length = 150, nullable = false, unique = true)
    private String email;

    @Size(max = 20, message = "Số điện thoại không vượt quá 20 ký tự")
    @Column(name = "phone", length = 20, unique = true)
    private String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, max = 255, message = "Mật khẩu phải từ 6 đến 255 ký tự")
    @Column(name = "password", length = 255, nullable = false)
    private String password;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Size(max = 500, message = "Địa chỉ không vượt quá 500 ký tự")
    @Column(name = "address", length = 500)
    private String address;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Quan hệ ManyToMany với Role thông qua bảng trung gian user_roles
    @Builder.Default
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id", referencedColumnName = "id", foreignKey = @ForeignKey(name = "fk_user_roles_user")),
            inverseJoinColumns = @JoinColumn(name = "role_id", referencedColumnName = "id", foreignKey = @ForeignKey(name = "fk_user_roles_role"))
    )
    private Set<Role> roles = new HashSet<>();

    // Quan hệ OneToMany với Hồ sơ đo chân AI Fit
    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<AIFitProfile> aiFitProfiles = new ArrayList<>();

    // Quan hệ OneToMany với Lịch sử đơn hàng
    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Order> orders = new ArrayList<>();

    // Helper methods
    public void addRole(Role role) {
        this.roles.add(role);
        role.getUsers().add(this);
    }

    public void removeRole(Role role) {
        this.roles.remove(role);
        role.getUsers().remove(this);
    }

    public void addAiFitProfile(AIFitProfile profile) {
        this.aiFitProfiles.add(profile);
        profile.setUser(this);
    }
}
