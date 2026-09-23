package com.shoestore.util;

import com.shoestore.dto.response.SizeCalculateResponse;
import com.shoestore.enums.ArchType;
import com.shoestore.enums.FootShape;
import com.shoestore.enums.FootType;
import com.shoestore.enums.PreferredFit;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Thuật toán Ma trận Kích thước Giày Thông minh (AI Sizing Matrix Engine)
 * Quy đổi từ chiều dài (cm), chiều rộng (cm), dáng vòm chân (ArchType),
 * độ bè mu bàn chân (FootShape) và gu mang (PreferredFit)
 * có hiệu chỉnh ma trận chi tiết theo từng thương hiệu (Nike/Jordan, Adidas, Puma).
 */
public final class SizingCalculatorUtil {

    private SizingCalculatorUtil() {
        // Utility class
    }

    public static class SizeRecommendationResult {
        private final String recommendedSizeEu;
        private final String recommendedSizeUs;
        private final double confidenceScore;
        private final String fittingAdvice;
        private final String fitAssessment; // "Vừa vặn chuẩn xác", "Hơi ôm mũi", "Nên tăng 0.5 size", "Nên tăng 1.0 size"
        private final FootShape detectedFootShape;
        private final ArchType detectedArchType;
        private final PreferredFit detectedPreferredFit;

        public SizeRecommendationResult(
                String recommendedSizeEu,
                String recommendedSizeUs,
                double confidenceScore,
                String fittingAdvice,
                String fitAssessment,
                FootShape detectedFootShape,
                ArchType detectedArchType,
                PreferredFit detectedPreferredFit
        ) {
            this.recommendedSizeEu = recommendedSizeEu;
            this.recommendedSizeUs = recommendedSizeUs;
            this.confidenceScore = confidenceScore;
            this.fittingAdvice = fittingAdvice;
            this.fitAssessment = fitAssessment;
            this.detectedFootShape = detectedFootShape;
            this.detectedArchType = detectedArchType;
            this.detectedPreferredFit = detectedPreferredFit;
        }

        public String getRecommendedSizeEu() {
            return recommendedSizeEu;
        }

        public String getRecommendedSizeUs() {
            return recommendedSizeUs;
        }

        public double getConfidenceScore() {
            return confidenceScore;
        }

        public String getFittingAdvice() {
            return fittingAdvice;
        }

        public String getFitAssessment() {
            return fitAssessment;
        }

        public FootShape getDetectedFootShape() {
            return detectedFootShape;
        }

        public ArchType getDetectedArchType() {
            return detectedArchType;
        }

        public PreferredFit getDetectedPreferredFit() {
            return detectedPreferredFit;
        }
    }

    // Ma trận cơ sở: Chiều dài chân (cm) -> Size EU tiêu chuẩn
    private static final Map<Double, String> LENGTH_TO_EU_MAP = new LinkedHashMap<>();
    // Ma trận quy đổi: Size EU -> Size US Men
    private static final Map<String, String> EU_TO_US_MAP = new LinkedHashMap<>();

    static {
        LENGTH_TO_EU_MAP.put(22.0, "35.5");
        LENGTH_TO_EU_MAP.put(22.5, "36");
        LENGTH_TO_EU_MAP.put(23.0, "36.5");
        LENGTH_TO_EU_MAP.put(23.5, "37.5");
        LENGTH_TO_EU_MAP.put(24.0, "38");
        LENGTH_TO_EU_MAP.put(24.5, "39");
        LENGTH_TO_EU_MAP.put(25.0, "40");
        LENGTH_TO_EU_MAP.put(25.5, "40.5");
        LENGTH_TO_EU_MAP.put(26.0, "41");
        LENGTH_TO_EU_MAP.put(26.5, "42");
        LENGTH_TO_EU_MAP.put(27.0, "42.5");
        LENGTH_TO_EU_MAP.put(27.5, "43");
        LENGTH_TO_EU_MAP.put(28.0, "44");
        LENGTH_TO_EU_MAP.put(28.5, "44.5");
        LENGTH_TO_EU_MAP.put(29.0, "45");
        LENGTH_TO_EU_MAP.put(29.5, "46");
        LENGTH_TO_EU_MAP.put(30.0, "46.5");
        LENGTH_TO_EU_MAP.put(30.5, "47.5");
        LENGTH_TO_EU_MAP.put(31.0, "48");

        EU_TO_US_MAP.put("35.5", "4.0");
        EU_TO_US_MAP.put("36", "4.5");
        EU_TO_US_MAP.put("36.5", "5.0");
        EU_TO_US_MAP.put("37.5", "5.5");
        EU_TO_US_MAP.put("38", "6.0");
        EU_TO_US_MAP.put("38.5", "6.0");
        EU_TO_US_MAP.put("39", "6.5");
        EU_TO_US_MAP.put("40", "7.0");
        EU_TO_US_MAP.put("40.5", "7.5");
        EU_TO_US_MAP.put("41", "8.0");
        EU_TO_US_MAP.put("42", "8.5");
        EU_TO_US_MAP.put("42.5", "9.0");
        EU_TO_US_MAP.put("43", "9.5");
        EU_TO_US_MAP.put("44", "10.0");
        EU_TO_US_MAP.put("44.5", "10.5");
        EU_TO_US_MAP.put("45", "11.0");
        EU_TO_US_MAP.put("46", "11.5");
        EU_TO_US_MAP.put("46.5", "12.0");
        EU_TO_US_MAP.put("47.5", "12.5");
        EU_TO_US_MAP.put("48", "13.0");
    }

    /**
     * Tính toán kích thước giày chi tiết dựa trên thông số sinh trắc học và hiệu chỉnh từng hãng
     */
    public static SizeRecommendationResult calculateSize(
            double lengthCm,
            double widthCm,
            FootShape footShape,
            ArchType archType,
            PreferredFit preferredFit,
            String brandName
    ) {
        // Fallback mặc định
        if (footShape == null) {
            footShape = detectFootShapeFromDimensions(lengthCm, widthCm);
        }
        if (archType == null) {
            archType = ArchType.NORMAL;
        }
        if (preferredFit == null) {
            preferredFit = PreferredFit.PERFECT;
        }

        // 1. Tìm mốc chiều dài gần nhất trong ma trận chuẩn
        double matchedLength = 26.5;
        double minDiff = Double.MAX_VALUE;

        for (Double standardLength : LENGTH_TO_EU_MAP.keySet()) {
            double diff = Math.abs(standardLength - lengthCm);
            if (diff < minDiff) {
                minDiff = diff;
                matchedLength = standardLength;
            }
        }

        String baseSizeEu = LENGTH_TO_EU_MAP.getOrDefault(matchedLength, "42");
        String recommendedEu = baseSizeEu;
        String fitAssessment = "Vừa vặn chuẩn xác";
        StringBuilder advice = new StringBuilder();

        // 2. Tính tỷ lệ chiều rộng / chiều dài
        double widthRatio = (lengthCm > 0 && widthCm > 0) ? (widthCm / lengthCm) : 0.38;
        boolean isWideFoot = (footShape == FootShape.WIDE) || (widthRatio > 0.40);
        boolean isSlimFoot = (footShape == FootShape.SLIM) || (widthRatio < 0.36);

        String brand = brandName != null ? brandName.trim().toLowerCase() : "";

        // 3. Hiệu chỉnh ma trận theo đặc thù form từng hãng
        if (brand.contains("nike") || brand.contains("jordan")) {
            // Nike / Jordan: Form giày ôm chân hơn bình thường
            if (isWideFoot && preferredFit == PreferredFit.ROOMY) {
                recommendedEu = addHalfSizes(baseSizeEu, 2); // +1.0 size EU
                fitAssessment = "Nên tăng 1.0 size";
                advice.append("Form giày ").append(brandName != null ? brandName : "Nike")
                        .append(" ôm sát cổ chân và mũi. Do bàn chân bạn bè ngang và thích mang rộng rãi, AI khuyên bạn nên tăng 1.0 size EU để các ngón chân thoải mái nhất. ");
            } else if (isWideFoot || preferredFit == PreferredFit.ROOMY) {
                recommendedEu = addHalfSizes(baseSizeEu, 1); // +0.5 size EU
                fitAssessment = "Nên tăng 0.5 size";
                advice.append("Form giày ").append(brandName != null ? brandName : "Nike")
                        .append(" thiết kế ôm chân thể thao. AI khuyên bạn nên tăng 0.5 size so với kích thước tiêu chuẩn để vừa vặn dễ chịu. ");
            } else if (preferredFit == PreferredFit.SNUG && isSlimFoot) {
                fitAssessment = "Ôm sát thi đấu";
                advice.append("Bàn chân thon và chọn form ôm sát. Giày Nike chuẩn size sẽ khóa gót hoàn hảo cho bạn. ");
            } else {
                fitAssessment = "Vừa vặn chuẩn xác";
                advice.append("Form giày Nike chuẩn form thể thao, vừa vặn chính xác với bàn chân bạn. ");
            }
        } else if (brand.contains("adidas")) {
            // Adidas: Thường chuẩn form hoặc hơi dài phần mũi -> chỉ cộng 0.5 nếu chân quá bè
            if (isWideFoot && (widthRatio > 0.41 || preferredFit == PreferredFit.ROOMY)) {
                recommendedEu = addHalfSizes(baseSizeEu, 1); // +0.5 size EU
                fitAssessment = "Nên tăng 0.5 size";
                advice.append("Form giày Adidas phần mũi dài hơn nhẹ. Do bàn chân bạn có độ bè ngang, AI khuyên bạn tăng 0.5 size để không bị cấn hai bên mu bàn chân. ");
            } else {
                fitAssessment = "Vừa vặn chuẩn xác (True to size)";
                advice.append("Khuôn giày Adidas chuẩn form quốc tế, mang lại độ ôm vừa vặn tối ưu mà không cần tăng size. ");
            }
        } else if (brand.contains("puma")) {
            // Puma: Thân giày thường thon dài -> tính toán theo tỷ lệ chiều rộng / chiều dài
            if (widthRatio > 0.41 || (isWideFoot && preferredFit == PreferredFit.ROOMY)) {
                recommendedEu = addHalfSizes(baseSizeEu, 2); // +1.0 size EU
                fitAssessment = "Nên tăng 1.0 size";
                advice.append("Form giày Puma thường thon dài cổ điển. Tỷ lệ chiều rộng chân của bạn cao (")
                        .append(Math.round(widthRatio * 100.0) / 100.0)
                        .append("), AI khuyên nên tăng 1.0 size để tránh cảm giác bó ép mu chân. ");
            } else if (widthRatio > 0.395 || isWideFoot || preferredFit == PreferredFit.ROOMY) {
                recommendedEu = addHalfSizes(baseSizeEu, 1); // +0.5 size EU
                fitAssessment = "Nên tăng 0.5 size";
                advice.append("Thiết kế giày Puma có dáng thon gọn. AI đề xuất bạn nên tăng 0.5 size để có trải nghiệm êm ái nhất cả ngày. ");
            } else {
                fitAssessment = "Vừa vặn chuẩn xác";
                advice.append("Form giày Puma thon gọn ôm sát hoàn hảo theo tỷ lệ bàn chân của bạn. ");
            }
        } else {
            // Thương hiệu khác hoặc không chỉ định hãng
            if (isWideFoot || preferredFit == PreferredFit.ROOMY) {
                recommendedEu = addHalfSizes(baseSizeEu, 1);
                fitAssessment = "Nên tăng 0.5 size";
                advice.append("Khuyến nghị tăng 0.5 size để đảm bảo sự thoải mái khi di chuyển. ");
            } else {
                fitAssessment = "Vừa vặn chuẩn xác";
                advice.append("Vừa vặn theo tiêu chuẩn đo lường quốc tế. ");
            }
        }

        // 4. Bổ sung tư vấn dạng vòm chân
        if (archType == ArchType.LOW_FLAT) {
            advice.append("Lưu ý vòm chân bẹt: Bạn nên chọn giày có bộ đệm ổn định (Stability) và đệm gót vững chãi.");
        } else if (archType == ArchType.HIGH) {
            advice.append("Lưu ý vòm chân cao: Ưu tiên dòng giày có công nghệ trợ lực đệm khí (Zoom Air/Boost) để hấp thụ xung chấn.");
        }

        // 5. Tính toán Confidence Score (Độ tin cậy: từ 95.0% đến 99.4%)
        double confidence = Math.max(95.0, Math.min(99.4, 98.8 - (minDiff * 4.0)));
        confidence = Math.round(confidence * 10.0) / 10.0;

        String sizeUs = EU_TO_US_MAP.getOrDefault(recommendedEu, "8.5");

        return new SizeRecommendationResult(
                recommendedEu,
                sizeUs,
                confidence,
                advice.toString().trim(),
                fitAssessment,
                footShape,
                archType,
                preferredFit
        );
    }

    /**
     * Tương thích ngược với hàm gọi cũ truyền FootType
     */
    public static SizeRecommendationResult calculateSize(
            double lengthCm,
            double widthCm,
            FootType footType,
            String brandName
    ) {
        FootShape shape = FootShape.STANDARD;
        ArchType arch = ArchType.NORMAL;

        if (footType != null) {
            switch (footType) {
                case SLIM -> shape = FootShape.SLIM;
                case WIDE -> shape = FootShape.WIDE;
                case FLAT -> arch = ArchType.LOW_FLAT;
                case HIGH_ARCH -> arch = ArchType.HIGH;
                default -> shape = FootShape.STANDARD;
            }
        }

        return calculateSize(lengthCm, widthCm, shape, arch, PreferredFit.PERFECT, brandName);
    }

    /**
     * Tự động phán đoán dáng bàn chân (SLIM, STANDARD, WIDE) từ số đo cm nếu chưa có thông tin
     */
    public static FootShape detectFootShapeFromDimensions(double lengthCm, double widthCm) {
        if (lengthCm <= 0 || widthCm <= 0) {
            return FootShape.STANDARD;
        }
        double ratio = widthCm / lengthCm;
        if (ratio < 0.365) {
            return FootShape.SLIM;
        } else if (ratio > 0.40) {
            return FootShape.WIDE;
        }
        return FootShape.STANDARD;
    }

    /**
     * Tăng số nấc size (mỗi nấc tương ứng 0.5 size EU)
     */
    private static String addHalfSizes(String currentSize, int steps) {
        String res = currentSize;
        for (int i = 0; i < steps; i++) {
            res = getNextHalfSize(res);
        }
        return res;
    }

    private static String getNextHalfSize(String currentSize) {
        return switch (currentSize) {
            case "35.5" -> "36";
            case "36" -> "36.5";
            case "36.5" -> "37.5";
            case "37.5" -> "38";
            case "38" -> "38.5";
            case "38.5" -> "39";
            case "39" -> "40";
            case "40" -> "40.5";
            case "40.5" -> "41";
            case "41" -> "42";
            case "42" -> "42.5";
            case "42.5" -> "43";
            case "43" -> "44";
            case "44" -> "44.5";
            case "44.5" -> "45";
            case "45" -> "46";
            case "46" -> "46.5";
            case "46.5" -> "47.5";
            case "47.5" -> "48";
            default -> currentSize;
        };
    }

    /**
     * Thuật toán tính size chuẩn NewMos (Size 36 - 40)
     * Chiều dài <= 22.5 cm -> Size 36
     * 22.6 - 23.0 cm -> Size 37
     * 23.1 - 23.5 cm -> Size 38
     * 23.6 - 24.0 cm -> Size 39
     * 24.1 - 24.5 cm (hoặc > 24.0 cm) -> Size 40
     * Quy tắc bù trừ: Nếu footShape === "WIDE", tự động đề xuất tăng thêm 1 size
     */
    public static SizeCalculateResponse calculateNewMosSize(
            Double footLengthCm,
            FootShape footShape,
            String shoeModel
    ) {
        if (footLengthCm == null || footLengthCm <= 0) {
            footLengthCm = 23.5;
        }
        if (footShape == null) {
            footShape = FootShape.STANDARD;
        }

        // 1. Tính base size theo bảng NewMos
        int baseSize;
        if (footLengthCm <= 22.5) {
            baseSize = 36;
        } else if (footLengthCm <= 23.0) {
            baseSize = 37;
        } else if (footLengthCm <= 23.5) {
            baseSize = 38;
        } else if (footLengthCm <= 24.0) {
            baseSize = 39;
        } else {
            baseSize = 40;
        }

        // Chuẩn hóa tên dòng giày
        String modelName = "Runner Pro";
        if (shoeModel != null && !shoeModel.isBlank()) {
            String clean = shoeModel.replace("_", " ").replace("-", " ").trim();
            String[] words = clean.split("\\s+");
            StringBuilder sb = new StringBuilder();
            for (String w : words) {
                if (!w.isEmpty()) {
                    sb.append(Character.toUpperCase(w.charAt(0)))
                      .append(w.substring(1).toLowerCase())
                      .append(" ");
                }
            }
            modelName = sb.toString().trim();
        }

        int recommendedSize;
        String fitStatus;
        String advice;

        // 2. Quy tắc bù trừ
        if (footShape == FootShape.WIDE) {
            if (baseSize >= 40) {
                recommendedSize = 40;
                fitStatus = "Chân bè mu dày - Đề xuất size 40 (Size tối đa của NewMos)";
                advice = "Mẫu " + modelName + " form ôm thể thao. Do chân bạn bè/mu dày và mẫu đã đạt size 40 tối đa, bạn nên nới nhẹ dây giày để ngón chân thoải mái nhất.";
            } else {
                recommendedSize = baseSize + 1;
                fitStatus = "Nên tăng 1 size do chân bè";
                advice = "Mẫu " + modelName + " form ôm thể thao, tăng 1 size giúp ngón chân thoải mái khi vận động.";
            }
        } else if (footShape == FootShape.SLIM) {
            recommendedSize = baseSize;
            fitStatus = "Vừa vặn ôm chân (Chân thon)";
            advice = "Mẫu " + modelName + " thiết kế chuẩn form thể thao. Bàn chân thon gọn của bạn sẽ được ôm sát và khóa gót chắc chắn ở size " + recommendedSize + ".";
        } else {
            recommendedSize = baseSize;
            fitStatus = "Chuẩn size NewMos (True to size)";
            advice = "Mẫu " + modelName + " chuẩn kích thước NewMos. Bàn chân bạn vừa vặn hoàn hảo với size " + recommendedSize + ".";
        }

        return SizeCalculateResponse.builder()
                .recommendedSize(recommendedSize)
                .fitStatus(fitStatus)
                .advice(advice)
                .build();
    }
}
