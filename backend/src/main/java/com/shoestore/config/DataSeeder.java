package com.shoestore.config;

import com.shoestore.entity.*;
import com.shoestore.entity.enums.Gender;
import com.shoestore.enums.RoleType;
import com.shoestore.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

/**
 * Component tự động khởi tạo dữ liệu ban đầu (Data Seeder) cho dự án Shoe Store.
 * Đảm bảo Idempotent: kiểm tra theo slug/sku/email trước khi thêm mới hoặc cập nhật.
 */
@Slf4j
@Order(2)
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("[DataSeeder] Bắt đầu kiểm tra và nạp dữ liệu khởi tạo...");

        // 1. Khởi tạo Roles & Tài khoản mẫu
        Map<RoleType, Role> roleMap = seedRoles();
        seedUsers(roleMap);

        // 2. Khởi tạo Thương hiệu & Danh mục
        Map<String, Brand> brandMap = seedBrands();
        Map<String, Category> categoryMap = seedCategories();

        // 3. Khởi tạo 4 Sản phẩm NewMos thực tế cùng 20 biến thể SKU
        seedNewMosProducts(brandMap, categoryMap);

        // 4. Khởi tạo các sản phẩm mẫu phụ nếu cần
        seedLegacyProducts(brandMap, categoryMap);

        log.info("[DataSeeder] Hoàn thành quy trình kiểm tra và nạp dữ liệu khởi tạo thành công!");
    }

    private Map<RoleType, Role> seedRoles() {
        Map<RoleType, Role> roles = new EnumMap<>(RoleType.class);

        for (RoleType type : RoleType.values()) {
            Role role = roleRepository.findByName(type).orElseGet(() -> {
                Role newRole = Role.builder()
                        .name(type)
                        .description("Quyền hệ thống: " + type.name())
                        .build();
                return roleRepository.save(newRole);
            });
            roles.put(type, role);
        }
        return roles;
    }

    private void seedUsers(Map<RoleType, Role> roleMap) {
        Role adminRole = roleMap.get(RoleType.ROLE_ADMIN);
        Role userRole = roleMap.get(RoleType.ROLE_USER);

        // 1. Tạo tài khoản Admin
        if (!userRepository.existsByEmail("admin@shoestore.com")) {
            User admin = User.builder()
                    .fullName("Quản Trị Viên Hệ Thống")
                    .email("admin@shoestore.com")
                    .phone("0988888888")
                    .password(passwordEncoder.encode("admin123"))
                    .avatarUrl("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80")
                    .isActive(true)
                    .roles(new HashSet<>(Arrays.asList(adminRole, userRole)))
                    .build();
            userRepository.save(admin);
            log.info("[DataSeeder] Đã tạo tài khoản Quản trị viên: admin@shoestore.com");
        }

        // 2. Tạo tài khoản Khách hàng
        if (!userRepository.existsByEmail("user@shoestore.com")) {
            User customer = User.builder()
                    .fullName("Nguyễn Văn Khách Hàng")
                    .email("user@shoestore.com")
                    .phone("0977777777")
                    .password(passwordEncoder.encode("user123"))
                    .avatarUrl("https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80")
                    .isActive(true)
                    .roles(new HashSet<>(Collections.singletonList(userRole)))
                    .build();
            userRepository.save(customer);
            log.info("[DataSeeder] Đã tạo tài khoản Khách hàng: user@shoestore.com");
        }
    }

    private Map<String, Brand> seedBrands() {
        Map<String, Brand> brands = new HashMap<>();

        // Thương hiệu chủ đạo NewMos Sport
        createOrGetBrand(brands, "NewMos Sport", "NEWMOS",
                "Thương hiệu giày thể thao công nghệ NewMos - Thiết kế chuẩn phom chân châu Á cùng công nghệ phân tích AI thông minh.",
                "/images/products/navy/thumbnail.png",
                "https://newmos.vn");

        createOrGetBrand(brands, "Nike", "NIKE",
                "Thương hiệu thể thao hàng đầu thế giới với thông điệp Just Do It.",
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
                "https://www.nike.com");

        createOrGetBrand(brands, "Adidas", "ADIDAS",
                "Thương hiệu thể thao toàn cầu đến từ Đức với tinh thần Impossible is Nothing.",
                "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=400&q=80",
                "https://www.adidas.com");

        createOrGetBrand(brands, "Jordan", "JORDAN",
                "Thương hiệu bóng rổ biểu tượng toàn cầu của huyền thoại Michael Jordan.",
                "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=400&q=80",
                "https://www.nike.com/jordan");

        createOrGetBrand(brands, "Puma", "PUMA",
                "Thương hiệu thể thao và phong cách đường phố năng động Forever Faster.",
                "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=400&q=80",
                "https://www.puma.com");

        return brands;
    }

    private void createOrGetBrand(Map<String, Brand> map, String name, String code, String desc, String logo, String url) {
        Brand brand = brandRepository.findByCodeIgnoreCase(code).orElseGet(() -> {
            Brand newBrand = Brand.builder()
                    .name(name)
                    .code(code)
                    .description(desc)
                    .logoUrl(logo)
                    .websiteUrl(url)
                    .isActive(true)
                    .build();
            return brandRepository.save(newBrand);
        });
        map.put(code, brand);
    }

    private Map<String, Category> seedCategories() {
        Map<String, Category> categories = new HashMap<>();

        createOrGetCategory(categories, "Giày Chạy Bộ (Running)", "running",
                "Các dòng giày chuyên dụng cho chạy bộ, thiết kế đệm trợ lực êm ái bảo vệ khớp gối.");

        createOrGetCategory(categories, "Giày Chạy Bộ & Tập Luyện", "running-training",
                "Dòng giày đa năng kết hợp chạy bộ cự ly ngắn và các bài tập rèn luyện thể lực.");

        createOrGetCategory(categories, "Giày Thể Thao Đa Năng", "the-thao-da-nang",
                "Thiết kế tối ưu lực đẩy bàn chân, phù hợp đa dạng hoạt động thể thao ngoài trời và trong nhà.");

        createOrGetCategory(categories, "Giày Thể Thao Thời Trang & Chạy Bộ", "thoi-trang-chay-bo",
                "Phong cách cổ điển kết hợp hiện đại, ôm gọn cổ chân và dễ dàng phối đồ hằng ngày.");

        createOrGetCategory(categories, "Giày bóng rổ (Basketball)", "basketball",
                "Thiết kế cổ cao và cổ trung ôm chân, bám sân cực tốt và hỗ trợ bật nhảy tối đa.");

        createOrGetCategory(categories, "Giày thời trang (Lifestyle)", "lifestyle",
                "Phong cách đường phố trẻ trung, thời thượng, phối đồ linh hoạt và thoải mái suốt ngày dài.");

        return categories;
    }

    private void createOrGetCategory(Map<String, Category> map, String name, String slug, String desc) {
        Category category = categoryRepository.findBySlug(slug).orElseGet(() -> {
            Category newCategory = Category.builder()
                    .name(name)
                    .slug(slug)
                    .description(desc)
                    .isActive(true)
                    .build();
            return categoryRepository.save(newCategory);
        });
        map.put(slug, category);
    }

    /**
     * Nạp dữ liệu 4 mẫu giày NewMos thực tế và các biến thể kích thước 36 - 40.
     * Kiểm tra tính Idempotent qua slug và sku để tránh trùng lặp.
     */
    private void seedNewMosProducts(Map<String, Brand> brandMap, Map<String, Category> categoryMap) {
        log.info("[DataSeeder] Đang kiểm tra và nạp 4 mẫu giày NewMos thực tế...");

        Brand newmosBrand = brandMap.get("NEWMOS");
        List<String> sizes = Arrays.asList("36", "37", "38", "39", "40");
        Map<String, String> sizeUsMap = Map.of(
                "36", "5.0",
                "37", "5.5",
                "38", "6.0",
                "39", "6.5",
                "40", "7.5"
        );

        List<ProductSeedData> newMosList = Arrays.asList(
                // Sản phẩm 1: NewMos Runner X - Trắng Hồng (White / Pink)
                new ProductSeedData(
                        "NewMos Runner X - Trắng Hồng (White / Pink)",
                        "NM-RUNNER-X-PK",
                        "newmos-runner-x-trang-hong",
                        "Thiết kế thể thao năng động phối màu Trắng - Hồng trẻ trung, đệm êm giảm chấn, hỗ trợ đo size chân bằng AI chuẩn xác.",
                        "Vải dệt Flyknit thoáng khí & Đệm bọt EVA trợ lực",
                        Gender.UNISEX,
                        "NEWMOS",
                        "running",
                        true,
                        "Trắng Hồng",
                        "#FFB6C1",
                        "NM-PK",
                        15,
                        new BigDecimal("1450000"),
                        new BigDecimal("1250000"),
                        "/images/products/pink/cover.jpg",
                        Arrays.asList(
                                "/images/products/pink/cover.jpg",
                                "/images/products/pink/poster.jpg",
                                "/images/products/pink/detail-1.jpg",
                                "/images/products/pink/detail-2.jpg",
                                "/images/products/pink/angle-1.jpg",
                                "/images/products/pink/angle-2.jpg"
                        )
                ),

                // Sản phẩm 2: NewMos Runner Pro - Trắng Xanh Ngọc (White / Mint Green)
                new ProductSeedData(
                        "NewMos Runner Pro - Trắng Xanh Ngọc (White / Mint Green)",
                        "NM-RUNNER-PRO-MG",
                        "newmos-runner-pro-trang-xanh-ngoc",
                        "Phối màu Trắng Xanh Ngọc thanh lịch, mặt lưới thoáng khí tối đa, đế bám đường chống trơn trượt hiệu quả.",
                        "Lưới Mesh thoáng khí & Đế cao su lưu hóa chống trơn trượt",
                        Gender.UNISEX,
                        "NEWMOS",
                        "running-training",
                        true,
                        "Trắng Xanh Ngọc",
                        "#48D1CC",
                        "NM-MG",
                        20,
                        new BigDecimal("1550000"),
                        new BigDecimal("1350000"),
                        "/images/products/mint/cover.jpg",
                        Arrays.asList(
                                "/images/products/mint/cover.jpg",
                                "/images/products/mint/poster.jpg",
                                "/images/products/mint/detail-1.jpg",
                                "/images/products/mint/detail-2.jpg",
                                "/images/products/mint/ig-10.png",
                                "/images/products/mint/angle-1.jpg",
                                "/images/products/mint/angle-2.jpg"
                        )
                ),

                // Sản phẩm 3: NewMos Air Speed - Trắng Xanh Dương (White / Ocean Blue)
                new ProductSeedData(
                        "NewMos Air Speed - Trắng Xanh Dương (White / Ocean Blue)",
                        "NM-AIR-SPEED-BL",
                        "newmos-air-speed-trang-xanh-duong",
                        "Tông màu Trắng kết hợp Xanh Dương khỏe khoắn, đệm bọt khí đàn hồi cao, thiết kế tối ưu lực đẩy bàn chân.",
                        "Vải dệt Mesh kỹ thuật số & Đệm khí Air đàn hồi cao",
                        Gender.UNISEX,
                        "NEWMOS",
                        "the-thao-da-nang",
                        true,
                        "Trắng Xanh Dương",
                        "#0077B6",
                        "NM-BL",
                        18,
                        new BigDecimal("1590000"),
                        new BigDecimal("1390000"),
                        "/images/products/ocean/cover.jpg",
                        Arrays.asList(
                                "/images/products/ocean/cover.jpg",
                                "/images/products/ocean/poster.png",
                                "/images/products/ocean/tech-sole.png",
                                "/images/products/ocean/tech-upper.png",
                                "/images/products/ocean/tech-heel.png",
                                "/images/products/ocean/angle-1.jpg",
                                "/images/products/ocean/angle-2.jpg"
                        )
                ),

                // Sản phẩm 4: NewMos Apex Court - Trắng Xanh Navy (White / Navy)
                new ProductSeedData(
                        "NewMos Apex Court - Trắng Xanh Navy (White / Navy)",
                        "NM-APEX-COURT-NV",
                        "newmos-apex-court-trang-xanh-navy",
                        "Phong cách cổ điển pha hiện đại với viền Xanh Navy đậm nét, form ôm chuẩn bàn chân châu Á theo phân tích AI.",
                        "Da cao cấp phối nỉ & Đế Cupsole cổ điển",
                        Gender.UNISEX,
                        "NEWMOS",
                        "thoi-trang-chay-bo",
                        true,
                        "Trắng Navy",
                        "#001F3F",
                        "NM-NV",
                        12,
                        new BigDecimal("1650000"),
                        new BigDecimal("1450000"),
                        "/images/products/navy/cover.png",
                        Arrays.asList(
                                "/images/products/navy/cover.png",
                                "/images/products/navy/poster.png",
                                "/images/products/navy/detail-2.png",
                                "/images/products/navy/detail-3.png",
                                "/images/products/navy/ig-2.png",
                                "/images/products/navy/angle-1.jpg",
                                "/images/products/navy/angle-2.jpg"
                        )
                )
        );

        for (ProductSeedData data : newMosList) {
            Category category = categoryMap.get(data.categorySlug());

            Product product = productRepository.findBySlug(data.slug()).orElseGet(() -> {
                Product newProd = Product.builder()
                        .name(data.name())
                        .code(data.code())
                        .slug(data.slug())
                        .description(data.description())
                        .material(data.material())
                        .gender(data.gender())
                        .brand(newmosBrand)
                        .category(category)
                        .isFeatured(data.isFeatured())
                        .isActive(true)
                        .variants(new ArrayList<>())
                        .build();
                return productRepository.save(newProd);
            });

            // Cập nhật thông tin mới nhất nếu sản phẩm đã tồn tại
            product.setName(data.name());
            product.setCode(data.code());
            product.setDescription(data.description());
            product.setMaterial(data.material());
            product.setBrand(newmosBrand);
            product.setCategory(category);
            product.setIsFeatured(true);
            product.setIsActive(true);

            // Kiểm tra và sinh đủ 5 biến thể size 36 -> 40
            for (String sz : sizes) {
                String sku = data.skuPrefix() + "-" + sz;
                ProductVariant variant = productVariantRepository.findBySku(sku).orElse(null);

                if (variant == null) {
                    variant = ProductVariant.builder()
                            .product(product)
                            .sku(sku)
                            .color(data.color())
                            .colorCode(data.colorCode())
                            .sizeEu(sz)
                            .sizeUs(sizeUsMap.get(sz))
                            .price(data.salePrice())
                            .originalPrice(data.originalPrice())
                            .stockQuantity(data.stockPerSize())
                            .thumbnailUrl(data.thumbnailUrl())
                            .images(new ArrayList<>(data.images()))
                            .isActive(true)
                            .build();
                    product.addVariant(variant);
                } else {
                    variant.setPrice(data.salePrice());
                    variant.setOriginalPrice(data.originalPrice());
                    variant.setStockQuantity(data.stockPerSize());
                    variant.setThumbnailUrl(data.thumbnailUrl());
                    variant.setImages(new ArrayList<>(data.images()));
                    variant.setIsActive(true);
                }
            }

            productRepository.save(product);
            log.info("[DataSeeder] Đã đồng bộ sản phẩm NewMos: {} (SKUs: {}-36 đến 40)", data.name(), data.skuPrefix());
        }
    }

    /**
     * Nạp các mẫu giày phụ (Nike, Adidas...) nếu chưa có trong DB.
     */
    private void seedLegacyProducts(Map<String, Brand> brandMap, Map<String, Category> categoryMap) {
        List<String> sizesEu = Arrays.asList("39", "40", "41", "42", "43", "44");
        Map<String, String> sizeUsMap = Map.of(
                "39", "6.5", "40", "7.5", "41", "8.0", "42", "8.5", "43", "9.5", "44", "10.0"
        );

        List<ProductSeedData> legacyList = Arrays.asList(
                new ProductSeedData(
                        "Nike Air Jordan 1 Retro High",
                        "AJ1-RETRO-HIGH",
                        "nike-air-jordan-1-retro-high",
                        "Mẫu giày bóng rổ huyền thoại gắn liền với Michael Jordan năm 1985.",
                        "Da bò thật (Full-grain Leather)",
                        Gender.UNISEX,
                        "JORDAN",
                        "basketball",
                        false,
                        "Chicago Red/Black",
                        "#B30000",
                        "AJ1",
                        20,
                        new BigDecimal("4990000"),
                        new BigDecimal("4490000"),
                        "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80",
                        Arrays.asList("https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80")
                ),
                new ProductSeedData(
                        "Adidas Ultraboost Light",
                        "ADIDAS-ULTRABOOST-LIGHT",
                        "adidas-ultraboost-light",
                        "Đôi giày chạy bộ nhẹ nhất trong lịch sử Ultraboost với hạt BOOST siêu nhẹ hoàn trả năng lượng tối đa.",
                        "Vải dệt Primeknit+ bảo vệ môi trường",
                        Gender.MEN,
                        "ADIDAS",
                        "running",
                        false,
                        "Core Black / Solar Red",
                        "#222222",
                        "UB-LT",
                        25,
                        new BigDecimal("5200000"),
                        new BigDecimal("4690000"),
                        "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=1000&q=80",
                        Arrays.asList("https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=1000&q=80")
                )
        );

        for (ProductSeedData data : legacyList) {
            if (productRepository.existsBySlug(data.slug())) {
                continue;
            }
            Brand brand = brandMap.get(data.brandCode());
            Category category = categoryMap.get(data.categorySlug());

            Product product = Product.builder()
                    .name(data.name())
                    .code(data.code())
                    .slug(data.slug())
                    .description(data.description())
                    .material(data.material())
                    .gender(data.gender())
                    .brand(brand)
                    .category(category)
                    .isFeatured(data.isFeatured())
                    .isActive(true)
                    .variants(new ArrayList<>())
                    .build();

            for (String sizeEu : sizesEu) {
                String sku = data.code() + "-" + sizeEu;
                ProductVariant variant = ProductVariant.builder()
                        .product(product)
                        .sku(sku)
                        .color(data.color())
                        .colorCode(data.colorCode())
                        .sizeEu(sizeEu)
                        .sizeUs(sizeUsMap.get(sizeEu))
                        .price(data.salePrice())
                        .originalPrice(data.originalPrice())
                        .stockQuantity(data.stockPerSize())
                        .thumbnailUrl(data.thumbnailUrl())
                        .images(new ArrayList<>(data.images()))
                        .isActive(true)
                        .build();

                product.addVariant(variant);
            }
            productRepository.save(product);
        }
    }

    /**
     * Record định nghĩa dữ liệu seed của sản phẩm
     */
    private record ProductSeedData(
            String name,
            String code,
            String slug,
            String description,
            String material,
            Gender gender,
            String brandCode,
            String categorySlug,
            boolean isFeatured,
            String color,
            String colorCode,
            String skuPrefix,
            int stockPerSize,
            BigDecimal originalPrice,
            BigDecimal salePrice,
            String thumbnailUrl,
            List<String> images
    ) {}
}
