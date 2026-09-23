package com.shoestore.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @Size(max = 150, message = "Họ và tên không vượt quá 150 ký tự")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại không vượt quá 20 ký tự")
    private String phone;

    @Size(max = 500, message = "Địa chỉ không vượt quá 500 ký tự")
    private String address;

    private String avatarUrl;
}
