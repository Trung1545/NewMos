package com.shoestore.service.impl;

import com.shoestore.dto.request.ChatMessageItem;
import com.shoestore.dto.request.ChatMessageRequest;
import com.shoestore.dto.request.ProductContextDto;
import com.shoestore.dto.response.ChatSuggestedProduct;
import com.shoestore.dto.response.ChatbotResponse;
import com.shoestore.entity.Order;
import com.shoestore.entity.Product;
import com.shoestore.entity.ProductVariant;
import com.shoestore.repository.OrderRepository;
import com.shoestore.repository.ProductRepository;
import com.shoestore.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service xử lý ngôn ngữ và hội thoại thông minh cho NewMos AI Assistant.
 * Tích hợp NLP Rule-based thông minh, tra cứu Database newmos_db theo thời gian thực
 * và hỗ trợ fallback linh hoạt.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotServiceImpl implements ChatbotService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    @Value("${ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${ai.openai.api-key:}")
    private String openaiApiKey;

    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("###,### ₫");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // Regex trích xuất mã đơn hàng
    private static final Pattern ORDER_CODE_PATTERN = Pattern.compile("(?i)\\b(NM-[A-Z0-9_-]{4,}|ORD-[A-Z0-9_-]{4,})\\b");
    // Regex trích xuất chiều dài chân (cm)
    private static final Pattern FOOT_LENGTH_PATTERN = Pattern.compile("(?i)(?:dài|chân|khoảng|đo được)?\\s*(\\d{2}(?:[.,]\\d{1,2})?)\\s*(?:cm|centimet)?");
    // Regex trích xuất size giày đang đi
    private static final Pattern SHOE_SIZE_PATTERN = Pattern.compile("(?i)(?:size|cỡ|đang đi|hay đi|mang|chọn)\\s*(\\d{2})");

    @Override
    @Transactional(readOnly = true)
    public ChatbotResponse processMessage(ChatMessageRequest request) {
        String message = request.getMessage() != null ? request.getMessage().trim() : "";
        String lowerMsg = message.toLowerCase();

        log.info("[NewMos Chatbot] Xử lý tin nhắn: '{}'", message);

        // 1. Kiểm tra Ý định Tra cứu Đơn hàng
        Matcher orderMatcher = ORDER_CODE_PATTERN.matcher(message);
        if (orderMatcher.find() || lowerMsg.contains("đơn hàng") || lowerMsg.contains("mã đơn") || lowerMsg.contains("tra cứu")) {
            ChatbotResponse orderResp = handleOrderTracking(message, orderMatcher);
            if (orderResp != null) {
                return orderResp;
            }
        }

        // 2. Kiểm tra Ý định Tư vấn Size Giày
        if (isSizingIntent(lowerMsg, request.getProductContext())) {
            return handleSizeRecommendation(message, lowerMsg, request);
        }

        // 3. Kiểm tra Ý định Tìm kiếm / Gợi ý Sản phẩm
        if (isProductSearchIntent(lowerMsg)) {
            return handleProductSearch(lowerMsg, request);
        }

        // 4. Kiểm tra Ý định Hỏi đáp Chính sách / Địa chỉ / Chào hỏi
        if (isGreetingOrFaqIntent(lowerMsg)) {
            return handleGreetingOrFaq(lowerMsg);
        }

        // 5. Fallback thông minh mặc định
        return handleSmartFallback(message, request);
    }

    /**
     * Xử lý tra cứu đơn hàng theo mã đơn
     */
    private ChatbotResponse handleOrderTracking(String rawMsg, Matcher matcher) {
        String lowerMsg = rawMsg.toLowerCase();

        // Kiểm tra nếu là câu hỏi hướng dẫn chung (vd: "Cách kiểm tra đơn hàng", "Làm sao xem đơn")
        if (lowerMsg.contains("cách kiểm tra") || lowerMsg.contains("hướng dẫn kiểm tra") ||
            lowerMsg.contains("làm sao kiểm tra") || lowerMsg.contains("làm thế nào") ||
            (lowerMsg.contains("kiểm tra đơn") && !lowerMsg.contains("nm-") && !lowerMsg.contains("ord-"))) {
            return ChatbotResponse.builder()
                    .reply("📦 **Hướng dẫn tra cứu tiến độ đơn hàng tại NewMos**:\n\n" +
                           "1. Bạn chỉ cần gửi trực tiếp **Mã đơn hàng** (ví dụ: `NM-20260901` hoặc `ORD-100234`) vào ngay khung chat này, NewMos AI sẽ kiểm tra trạng thái đóng gói & vận chuyển tức thì!\n" +
                           "2. Hoặc bạn có thể đăng nhập và truy cập trang **Tài khoản > Đơn hàng của tôi** để xem chi tiết lịch sử mọi đơn hàng đã đặt.\n\n" +
                           "👉 Bạn hãy gửi mã đơn hàng của bạn vào đây để mình tra cứu ngay giúp bạn nhé!")
                    .action("TRACK_ORDER")
                    .build();
        }

        String code = null;
        if (matcher.reset().find()) {
            code = matcher.group(1).toUpperCase();
        } else {
            // Cố gắng tìm mã sau từ khóa "đơn số", "mã:", "order" chứa chữ và số
            Pattern fallbackPattern = Pattern.compile("(?i)(?:mã|order|đơn\\s*số|code)\\s*[:#-]?\\s*([A-Za-z0-9_-]{4,20})");
            Matcher m = fallbackPattern.matcher(rawMsg);
            if (m.find()) {
                String candidate = m.group(1);
                if (candidate.matches(".*\\d.*")) {
                    code = candidate.toUpperCase();
                }
            }
        }

        if (code != null) {
            Optional<Order> orderOpt = orderRepository.findByOrderCode(code);
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                String statusStr = switch (order.getOrderStatus()) {
                    case PENDING -> "⏳ Đang chờ xác nhận";
                    case CONFIRMED -> "✅ Đã xác nhận, NewMos đang chuẩn bị hàng";
                    case PROCESSING -> "📦 Đang đóng gói tại kho NewMos";
                    case SHIPPING, SHIPPED -> "🚚 Đang được vận chuyển giao đến bạn";
                    case DELIVERED, COMPLETED -> "🎉 Đã giao hàng thành công";
                    case CANCELLED -> "❌ Đơn hàng đã hủy";
                    default -> "📋 Đang cập nhật tiến độ";
                };

                String totalFormatted = order.getTotalAmount() != null ? CURRENCY_FORMAT.format(order.getTotalAmount()) : "0 ₫";
                String dateFormatted = order.getCreatedAt() != null ? order.getCreatedAt().format(DATE_FORMAT) : "Gần đây";

                String reply = String.format(
                        "📦 **Thông tin tra cứu đơn hàng #%s**:\n\n" +
                        "• **Khách hàng**: %s (%s)\n" +
                        "• **Thời gian đặt**: %s\n" +
                        "• **Trạng thái**: %s\n" +
                        "• **Tổng thanh toán**: %s\n" +
                        "• **Địa chỉ nhận**: %s\n\n" +
                        "✨ NewMos luôn cam kết giao hàng hỏa tốc và hỗ trợ đổi size miễn phí tận nhà trong vòng 7 ngày! Bạn cần hỗ trợ thêm thông tin gì về đơn hàng này không ạ?",
                        order.getOrderCode(),
                        order.getRecipientName(),
                        order.getRecipientPhone(),
                        dateFormatted,
                        statusStr,
                        totalFormatted,
                        order.getShippingAddress() != null ? order.getShippingAddress() : "Theo địa chỉ đăng ký"
                );

                return ChatbotResponse.builder()
                        .reply(reply)
                        .action("TRACK_ORDER")
                        .build();
            } else {
                return ChatbotResponse.builder()
                        .reply("🔍 NewMos đã kiểm tra hệ thống nhưng chưa tìm thấy đơn hàng với mã **" + code + "**. " +
                               "Bạn vui lòng kiểm tra lại mã đơn hàng chính xác (thường bắt đầu bằng NM- hoặc ORD-) hoặc cung cấp số điện thoại đặt hàng để mình tra cứu giúp nhé!")
                        .action("TRACK_ORDER")
                        .build();
            }
        }
        return null;
    }

    /**
     * Nhận diện ý định tư vấn kích cỡ chân (Size Sizing)
     */
    private boolean isSizingIntent(String lowerMsg, ProductContextDto productContext) {
        if (productContext != null && (lowerMsg.contains("size") || lowerMsg.contains("cỡ") || lowerMsg.contains("vừa") || lowerMsg.contains("chân"))) {
            return true;
        }
        return lowerMsg.contains("size") || lowerMsg.contains("cỡ") || lowerMsg.contains("chân dài") ||
               lowerMsg.contains("cm") || lowerMsg.contains("bè") || lowerMsg.contains("mu dày") ||
               lowerMsg.contains("thon") || lowerMsg.contains("chọn size") || lowerMsg.contains("đi size") ||
               lowerMsg.contains("mang size") || lowerMsg.contains("vừa chân");
    }

    /**
     * Xử lý thuật toán ma trận size NewMos (36 - 40) và đưa ra lời khuyên chuyên sâu
     */
    private ChatbotResponse handleSizeRecommendation(String rawMsg, String lowerMsg, ChatMessageRequest request) {
        Double footLengthCm = extractFootLength(rawMsg);
        Integer currentSize = extractCurrentSize(rawMsg);

        boolean isWideFoot = lowerMsg.contains("bè") || lowerMsg.contains("to ngang") || lowerMsg.contains("mu dày") ||
                             lowerMsg.contains("chân dày") || lowerMsg.contains("chân mập") || lowerMsg.contains("mu cao");
        boolean isSlimFoot = lowerMsg.contains("thon") || lowerMsg.contains("gầy") || lowerMsg.contains("mỏng") || lowerMsg.contains("nhỏ");

        // Nhận diện mẫu giày đang hỏi hoặc từ context
        Product targetProduct = resolveTargetProduct(lowerMsg, request.getProductContext());
        String shoeName = targetProduct != null ? targetProduct.getName() : "NewMos Runner Pro";
        String shoeSlug = targetProduct != null ? targetProduct.getSlug() : "newmos-runner-pro-trang-xanh-ngoc";

        int recommendedSize = 38; // Mặc định phổ biến
        String reason = "";

        if (footLengthCm != null) {
            // Tính toán theo chiều dài cm bàn chân
            double length = footLengthCm;
            if (length <= 22.7) {
                recommendedSize = 36;
            } else if (length <= 23.5) {
                recommendedSize = 37;
            } else if (length <= 24.2) {
                recommendedSize = 38;
            } else if (length <= 24.8) {
                recommendedSize = 39;
            } else {
                recommendedSize = 40;
            }

            // Hiệu chỉnh đặc tính form từng mẫu NewMos
            if (shoeSlug.contains("runner-pro")) {
                // NewMos Runner Pro: Form ôm thể thao khí động học
                if (isWideFoot) {
                    recommendedSize = Math.min(40, recommendedSize + 1);
                    reason = String.format("Chân bạn dài **%.1f cm** nhưng **bè mu/to ngang**, với mẫu **%s** form ôm thể thao bạn nên chọn **Size %d EU** để thoải mái ngón chân và đạt độ êm ái tối ưu nhất khi vận động.", length, shoeName, recommendedSize);
                } else if (isSlimFoot) {
                    reason = String.format("Bàn chân bạn dài **%.1f cm** dáng **thon gọn**. Mẫu **NewMos Runner Pro** sẽ ôm sát vừa vặn hoàn hảo chuẩn công nghệ AI Fit với **Size %d EU**.", length, recommendedSize);
                } else {
                    reason = String.format("Bàn chân bạn dài **%.1f cm** dáng chuẩn. Mẫu **NewMos Runner Pro** sẽ đi đúng chuẩn form quốc tế với **Size %d EU**.", length, recommendedSize);
                }
            } else if (shoeSlug.contains("runner-x")) {
                // NewMos Runner X: Form thể thao chuẩn quốc tế, đệm EVA êm ái
                if (isWideFoot && length > 23.3) {
                    recommendedSize = Math.min(40, recommendedSize + 1);
                    reason = String.format("Bàn chân bạn dài **%.1f cm** và hơi bè. Đôi **NewMos Runner X - Trắng Hồng** sử dụng chất liệu vải dệt Flyknit đàn hồi tốt, chọn **Size %d EU** sẽ mang lại cảm giác êm chân và thoát ẩm tối đa.", length, recommendedSize);
                } else {
                    reason = String.format("Bàn chân bạn dài **%.1f cm**. Mẫu **NewMos Runner X** chuẩn form True-To-Size, phù hợp nhất với **Size %d EU**.", length, recommendedSize);
                }
            } else if (shoeSlug.contains("air-speed")) {
                // NewMos Air Speed: Đệm khí bọt đàn hồi, lực đẩy mạnh
                if (isWideFoot) {
                    recommendedSize = Math.min(40, recommendedSize + 1);
                }
                reason = String.format("Bàn chân bạn dài **%.1f cm**. Dòng **NewMos Air Speed** trang bị túi đệm bọt khí trợ lực tối ưu, đề xuất kích thước lý tưởng là **Size %d EU**.", length, recommendedSize);
            } else {
                // NewMos Apex Court hoặc mẫu khác
                if (isWideFoot) {
                    recommendedSize = Math.min(40, recommendedSize + 1);
                }
                reason = String.format("Bàn chân bạn dài **%.1f cm**. Dựa trên phom dáng chuẩn châu Á của dòng **NewMos Apex Court**, cỡ giày chuẩn xác nhất cho bạn là **Size %d EU**.", length, recommendedSize);
            }
        } else if (currentSize != null) {
            // Tính toán dựa trên size giày hiện tại đang đi
            int cs = currentSize;
            if (isWideFoot && shoeSlug.contains("runner-pro")) {
                recommendedSize = Math.min(40, Math.max(36, cs + 1));
                reason = String.format("Bạn đang đi size **%d** và chân có độ bè ngang. Do mẫu **%s** có form ôm gót và mu bàn chân chuyên dụng cho chạy bộ, NewMos khuyên bạn nên nhích lên **Size %d EU** để mang vừa vặn và êm ái nhất.", cs, shoeName, recommendedSize);
            } else {
                recommendedSize = Math.min(40, Math.max(36, cs));
                reason = String.format("Bạn đang quen đi size **%d**. Form giày NewMos được thiết kế chuẩn phom bàn chân châu Á, bạn có thể chọn ngay **Size %d EU** vừa vặn như ý.", cs, recommendedSize);
            }
        } else {
            // Chưa có số đo cm và size, hướng dẫn người dùng
            String reply = "👟 **Hướng dẫn chọn size chuẩn xác từ NewMos AI**:\n\n" +
                           "Để NewMos AI tư vấn size chuẩn từng milimet cho bạn, bạn vui lòng cung cấp giúp mình:\n" +
                           "1. **Chiều dài bàn chân** (Ví dụ: *23.5cm*, *24cm*) hoặc cỡ giày bạn thường đi ở các hãng khác.\n" +
                           "2. **Đặc điểm bàn chân**: Chân thon, chuẩn hay có bè ngang/mu dày không ạ?\n\n" +
                           "👉 *Ví dụ bạn có thể gõ*: \"*Chân mình 23.5cm hơi bè mu tư vấn giúp mình mẫu Runner Pro*\" nhé!";

            List<ChatSuggestedProduct> suggestions = targetProduct != null ?
                    Collections.singletonList(mapToSuggestedProduct(targetProduct)) : getFeaturedNewMosProducts(2);

            return ChatbotResponse.builder()
                    .reply(reply)
                    .suggestedProducts(suggestions)
                    .action("GENERAL")
                    .build();
        }

        String replyText = String.format(
                "👟 **Kết Quả Phân Tích Kích Thước Bàn Chân AI**\n\n" +
                "%s\n\n" +
                "👉 **Kích thước khuyên dùng: SIZE %d EU**\n\n" +
                "✨ *Đặc quyền NewMos*: Miễn phí đổi trả size tận nơi trong **7 ngày** nếu bạn mang không vừa vặn. Bạn có thể bấm chọn size và đặt ngay hôm nay nhé!",
                reason,
                recommendedSize
        );

        List<ChatSuggestedProduct> suggestions = targetProduct != null ?
                Collections.singletonList(mapToSuggestedProduct(targetProduct)) : getFeaturedNewMosProducts(2);

        return ChatbotResponse.builder()
                .reply(replyText)
                .suggestedProducts(suggestions)
                .action("RECOMMEND_SIZE")
                .recommendedSize(recommendedSize)
                .build();
    }

    /**
     * Nhận diện ý định tìm kiếm sản phẩm theo màu, tính năng hoặc mức giá
     */
    private boolean isProductSearchIntent(String lowerMsg) {
        return lowerMsg.contains("tìm") || lowerMsg.contains("giày") || lowerMsg.contains("mẫu") ||
               lowerMsg.contains("màu") || lowerMsg.contains("hồng") || lowerMsg.contains("xanh") ||
               lowerMsg.contains("navy") || lowerMsg.contains("ngọc") || lowerMsg.contains("chạy bộ") ||
               lowerMsg.contains("tập luyện") || lowerMsg.contains("thể thao") || lowerMsg.contains("êm") ||
               lowerMsg.contains("giá") || lowerMsg.contains("dưới") || lowerMsg.contains("gợi ý");
    }

    /**
     * Tìm kiếm và gợi ý các mẫu giày NewMos thực tế từ Database
     */
    private ChatbotResponse handleProductSearch(String lowerMsg, ChatMessageRequest request) {
        List<Product> matched = new ArrayList<>();
        String desc = "";

        // Tìm theo màu sắc
        if (lowerMsg.contains("hồng") || lowerMsg.contains("pink")) {
            productRepository.findBySlug("newmos-runner-x-trang-hong").ifPresent(matched::add);
            desc = "Dạ đây là mẫu **NewMos Runner X - Trắng Hồng (White / Pink)** cực kỳ trẻ trung, đệm bọt EVA giảm chấn êm ái rất được yêu thích:";
        } else if (lowerMsg.contains("ngọc") || lowerMsg.contains("mint")) {
            productRepository.findBySlug("newmos-runner-pro-trang-xanh-ngoc").ifPresent(matched::add);
            desc = "Dạ đây là siêu phẩm **NewMos Runner Pro - Trắng Xanh Ngọc (White / Mint Green)** với mặt lưới thoáng khí tối đa và đế bám đường chống trơn trượt:";
        } else if (lowerMsg.contains("xanh dương") || lowerMsg.contains("ocean") || lowerMsg.contains("blue")) {
            productRepository.findBySlug("newmos-air-speed-trang-xanh-duong").ifPresent(matched::add);
            desc = "Dạ đây là mẫu **NewMos Air Speed - Trắng Xanh Dương (White / Ocean Blue)** với đệm khí đàn hồi cao, thiết kế tối ưu lực đẩy bàn chân:";
        } else if (lowerMsg.contains("navy") || lowerMsg.contains("xanh navy")) {
            productRepository.findBySlug("newmos-apex-court-trang-xanh-navy").ifPresent(matched::add);
            desc = "Dạ đây là mẫu **NewMos Apex Court - Trắng Xanh Navy (White / Navy)** mang phong cách cổ điển pha hiện đại, chuẩn phom chân châu Á:";
        } else if (lowerMsg.contains("chạy bộ") || lowerMsg.contains("running") || lowerMsg.contains("marathon")) {
            productRepository.findBySlug("newmos-runner-pro-trang-xanh-ngoc").ifPresent(matched::add);
            productRepository.findBySlug("newmos-runner-x-trang-hong").ifPresent(matched::add);
            desc = "Dạ NewMos gợi ý đến bạn 2 mẫu giày chạy bộ chuyên dụng hàng đầu với đệm êm trợ lực và đế chống trơn trượt hiệu quả:";
        } else if (lowerMsg.contains("êm") || lowerMsg.contains("nhẹ") || lowerMsg.contains("đệm khí") || lowerMsg.contains("thoải mái")) {
            productRepository.findBySlug("newmos-air-speed-trang-xanh-duong").ifPresent(matched::add);
            productRepository.findBySlug("newmos-runner-x-trang-hong").ifPresent(matched::add);
            desc = "Dạ nếu bạn cần mẫu giày đệm êm giảm chấn bảo vệ khớp gối tốt nhất, NewMos AI xin giới thiệu dòng **Air Speed** đệm khí và **Runner X** đệm EVA:";
        } else if (lowerMsg.contains("dưới 1tr3") || lowerMsg.contains("dưới 1.300.000") || lowerMsg.contains("dưới 1.3tr") || lowerMsg.contains("dưới 1 triệu 3")) {
            productRepository.findBySlug("newmos-runner-x-trang-hong").ifPresent(matched::add);
            desc = "Dạ với mức ngân sách dưới 1.300.000 ₫, mẫu **NewMos Runner X - Trắng Hồng** (Giá niêm yết: 1.250.000 ₫) là sự lựa chọn số 1 tuyệt vời dành cho bạn:";
        }

        // Nếu chưa khớp cụ thể thì lấy toàn bộ 4 mẫu NewMos
        if (matched.isEmpty()) {
            List<String> slugs = Arrays.asList(
                    "newmos-runner-pro-trang-xanh-ngoc",
                    "newmos-runner-x-trang-hong",
                    "newmos-air-speed-trang-xanh-duong",
                    "newmos-apex-court-trang-xanh-navy"
            );
            for (String s : slugs) {
                productRepository.findBySlug(s).ifPresent(matched::add);
            }
            desc = "Dạ NewMos xin giới thiệu bộ sưu tập 4 mẫu giày thể thao công nghệ NewMos chính hãng đang bán chạy nhất:";
        }

        List<ChatSuggestedProduct> suggestions = matched.stream()
                .map(this::mapToSuggestedProduct)
                .collect(Collectors.toList());

        String reply = desc + "\n\n" +
                       "Tất cả sản phẩm NewMos đều có đủ size từ **36 đến 40**, tích hợp công nghệ phân tích size chân AI chuẩn xác và hỗ trợ bảo hành 12 tháng. Bạn cần tư vấn chi tiết đôi nào cứ nhắn cho mình nhé!";

        return ChatbotResponse.builder()
                .reply(reply)
                .suggestedProducts(suggestions)
                .action("SUGGEST_PRODUCTS")
                .build();
    }

    private boolean isGreetingOrFaqIntent(String lowerMsg) {
        return lowerMsg.contains("xin chào") || lowerMsg.contains("hello") || lowerMsg.contains("hi") ||
               lowerMsg.contains("chào shop") || lowerMsg.contains("bảo hành") || lowerMsg.contains("đổi trả") ||
               lowerMsg.contains("giao hàng") || lowerMsg.contains("ship") || lowerMsg.contains("địa chỉ") ||
               lowerMsg.contains("cửa hàng");
    }

    private ChatbotResponse handleGreetingOrFaq(String lowerMsg) {
        if (lowerMsg.contains("đổi trả") || lowerMsg.contains("bảo hành") || lowerMsg.contains("đổi size")) {
            String reply = "🛡️ **Chính Sách Bảo Hành & Đổi Trả NewMos Chính Hãng**:\n\n" +
                           "• **Đổi size miễn phí trong 7 ngày**: Nếu bạn nhận giày thử không vừa size, NewMos sẽ cử nhân viên giao đôi size mới đến tận nhà và nhận lại đôi cũ hoàn toàn miễn phí!\n" +
                           "• **Bảo hành chính hãng 12 tháng**: Đối với các lỗi kỹ thuật về keo dán, đường may, đế giày.\n" +
                           "• **Cam kết 100% chính hãng**: Đền gấp 10 lần nếu phát hiện hàng giả.\n\n" +
                           "Bạn cần đổi size hoặc hỗ trợ đơn hàng nào cứ gửi mã đơn hoặc số điện thoại cho mình nhé!";
            return ChatbotResponse.builder().reply(reply).action("GENERAL").build();
        }

        if (lowerMsg.contains("giao hàng") || lowerMsg.contains("ship") || lowerMsg.contains("vận chuyển")) {
            String reply = "🚚 **Chính Sách Vận Chuyển Toàn Quốc**:\n\n" +
                           "• **Miễn phí vận chuyển (Freeship)**: Cho tất cả đơn hàng từ 1.000.000 ₫ (Toàn bộ 4 mẫu giày NewMos đều được miễn phí giao hàng).\n" +
                           "• **Thời gian giao hàng**: Nội thành Hà Nội/TP.HCM: 1 - 2 ngày; Các tỉnh thành khác: 2 - 3 ngày làm việc.\n" +
                           "• Cho phép **kiểm tra hàng** trước khi thanh toán!";
            return ChatbotResponse.builder().reply(reply).action("GENERAL").build();
        }

        // Chào hỏi mặc định
        String greeting = "Dạ xin chào bạn! Mình là **Trợ lý NewMos AI** - trợ lý ảo tư vấn bán hàng và chọn cỡ giày thông minh.\n\n" +
                          "Mình có thể giúp bạn:\n" +
                          "⚡ **Tư vấn chuẩn xác size giày NewMos (36-40)** theo số đo chiều dài cm hoặc dáng chân bè/thon.\n" +
                          "👟 **Gợi ý mẫu giày thể thao, chạy bộ êm ái** theo màu sắc và ngân sách.\n" +
                          "📦 **Tra cứu tiến độ giao hàng** tức thì qua mã đơn hàng.\n\n" +
                          "Bạn đang quan tâm đến mẫu giày nào hoặc cần mình tư vấn size đôi nào không ạ? 😊";

        return ChatbotResponse.builder()
                .reply(greeting)
                .suggestedProducts(getFeaturedNewMosProducts(3))
                .action("GENERAL")
                .build();
    }

    private ChatbotResponse handleSmartFallback(String message, ChatMessageRequest request) {
        String reply = "Dạ NewMos AI đã nhận được câu hỏi của bạn. " +
                       "Để phục vụ bạn tốt nhất, bạn có thể nhắn giúp mình số đo chân (ví dụ: *'chân dài 23.5cm'*), " +
                       "màu sắc giày yêu thích (hồng, xanh ngọc, xanh dương, navy), hoặc mã đơn hàng cần kiểm tra nhé!\n\n" +
                       "Dưới đây là các mẫu giày thể thao NewMos nổi bật nhất hôm nay:";

        return ChatbotResponse.builder()
                .reply(reply)
                .suggestedProducts(getFeaturedNewMosProducts(2))
                .action("GENERAL")
                .build();
    }

    /**
     * Tìm sản phẩm ngữ cảnh (dựa vào ProductContextDto hoặc phân tích tên trong tin nhắn)
     */
    private Product resolveTargetProduct(String lowerMsg, ProductContextDto context) {
        if (context != null && context.getSlug() != null) {
            Optional<Product> p = productRepository.findBySlug(context.getSlug());
            if (p.isPresent()) return p.get();
        }
        if (context != null && context.getId() != null) {
            Optional<Product> p = productRepository.findById(context.getId());
            if (p.isPresent()) return p.get();
        }

        if (lowerMsg.contains("runner pro") || lowerMsg.contains("xanh ngọc") || lowerMsg.contains("mint")) {
            return productRepository.findBySlug("newmos-runner-pro-trang-xanh-ngoc").orElse(null);
        }
        if (lowerMsg.contains("runner x") || lowerMsg.contains("hồng") || lowerMsg.contains("pink")) {
            return productRepository.findBySlug("newmos-runner-x-trang-hong").orElse(null);
        }
        if (lowerMsg.contains("air speed") || lowerMsg.contains("xanh dương") || lowerMsg.contains("ocean")) {
            return productRepository.findBySlug("newmos-air-speed-trang-xanh-duong").orElse(null);
        }
        if (lowerMsg.contains("apex court") || lowerMsg.contains("navy")) {
            return productRepository.findBySlug("newmos-apex-court-trang-xanh-navy").orElse(null);
        }

        // Mặc định lấy Runner Pro
        return productRepository.findBySlug("newmos-runner-pro-trang-xanh-ngoc").orElse(null);
    }

    private Double extractFootLength(String raw) {
        Matcher m = FOOT_LENGTH_PATTERN.matcher(raw);
        while (m.find()) {
            try {
                String valStr = m.group(1).replace(',', '.');
                double val = Double.parseDouble(valStr);
                if (val >= 21.0 && val <= 31.0) {
                    return val;
                }
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private Integer extractCurrentSize(String raw) {
        Matcher m = SHOE_SIZE_PATTERN.matcher(raw);
        while (m.find()) {
            try {
                int val = Integer.parseInt(m.group(1));
                if (val >= 35 && val <= 46) {
                    return val;
                }
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private ChatSuggestedProduct mapToSuggestedProduct(Product p) {
        BigDecimal price = BigDecimal.ZERO;
        String imageUrl = "/images/products/navy/thumbnail.png";

        if (p.getVariants() != null && !p.getVariants().isEmpty()) {
            ProductVariant v = p.getVariants().get(0);
            if (v.getPrice() != null) price = v.getPrice();
            if (v.getThumbnailUrl() != null) imageUrl = v.getThumbnailUrl();
        }

        return ChatSuggestedProduct.builder()
                .id(p.getId())
                .name(p.getName())
                .price(price)
                .imageUrl(imageUrl)
                .slug(p.getSlug())
                .build();
    }

    private List<ChatSuggestedProduct> getFeaturedNewMosProducts(int limit) {
        List<String> slugs = Arrays.asList(
                "newmos-runner-pro-trang-xanh-ngoc",
                "newmos-runner-x-trang-hong",
                "newmos-air-speed-trang-xanh-duong",
                "newmos-apex-court-trang-xanh-navy"
        );
        List<ChatSuggestedProduct> res = new ArrayList<>();
        for (String s : slugs) {
            if (res.size() >= limit) break;
            productRepository.findBySlug(s).ifPresent(p -> res.add(mapToSuggestedProduct(p)));
        }
        return res;
    }
}
