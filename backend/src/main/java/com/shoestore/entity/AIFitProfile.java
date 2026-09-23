package com.shoestore.entity;

import com.shoestore.enums.ArchType;
import com.shoestore.enums.FootShape;
import com.shoestore.enums.PreferredFit;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Thực thể AIFitProfile đại diện cho bảng ai_fit_profiles
 * lưu trữ số đo sinh trắc học bàn chân người dùng:
 * - foot_length_cm (Double, độ dài bàn chân)
 * - foot_width_cm (Double, độ rộng bàn chân)
 * - arch_type (Enum: LOW_FLAT, NORMAL, HIGH)
 * - foot_shape (Enum: SLIM, STANDARD, WIDE)
 * - preferred_fit (Enum: SNUG, PERFECT, ROOMY)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "ai_fit_profiles")
public class AIFitProfile extends BaseEntity {

    // Quan hệ ManyToOne với User sở hữu hồ sơ đo chân
    @NotNull(message = "Người dùng sở hữu hồ sơ không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_ai_profiles_user"))
    private User user;

    @NotBlank(message = "Tên hồ sơ không được để trống")
    @Size(max = 100, message = "Tên hồ sơ không vượt quá 100 ký tự")
    @Builder.Default
    @Column(name = "profile_name", length = 100, nullable = false)
    private String profileName = "Hồ sơ đo chân mặc định";

    @NotNull(message = "Chiều dài bàn chân không được để trống")
    @Positive(message = "Chiều dài bàn chân phải là số dương")
    @Column(name = "foot_length_cm", nullable = false)
    private Double footLengthCm;

    @NotNull(message = "Chiều rộng bàn chân không được để trống")
    @Positive(message = "Chiều rộng bàn chân phải là số dương")
    @Column(name = "foot_width_cm", nullable = false)
    private Double footWidthCm;

    @Enumerated(EnumType.STRING)
    @Column(name = "arch_type", length = 30)
    @Builder.Default
    private ArchType archType = ArchType.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "foot_shape", length = 50)
    @Builder.Default
    private FootShape footShape = FootShape.STANDARD;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_fit", length = 30)
    @Builder.Default
    private PreferredFit preferredFit = PreferredFit.PERFECT;

    @NotBlank(message = "Size EU khuyến nghị không được để trống")
    @Size(max = 10, message = "Size EU không vượt quá 10 ký tự")
    @Column(name = "recommended_size_eu", length = 10, nullable = false)
    private String recommendedSizeEu;

    @Size(max = 10, message = "Size US không vượt quá 10 ký tự")
    @Column(name = "recommended_size_us", length = 10)
    private String recommendedSizeUs;

    @Column(name = "scan_confidence_score")
    private Double scanConfidenceScore;

    @Column(name = "scan_image_url", length = 500)
    private String scanImageUrl;

    @Column(name = "fitting_advice", length = 500)
    private String fittingAdvice;

    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = true;

    @Size(max = 500, message = "Ghi chú không vượt quá 500 ký tự")
    @Column(name = "notes", length = 500)
    private String notes;
}
