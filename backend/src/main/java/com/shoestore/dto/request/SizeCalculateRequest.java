package com.shoestore.dto.request;

import com.shoestore.enums.FootShape;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SizeCalculateRequest {

    @NotNull(message = "Chiều dài bàn chân không được để trống")
    @Positive(message = "Chiều dài bàn chân phải lớn hơn 0")
    private Double footLengthCm;

    private FootShape footShape; // SLIM, STANDARD, WIDE

    private String shoeModel; // Ví dụ: "RUNNER_PRO"
}
