-- ==============================================================================
-- Flyway Migration V2: Nạp dữ liệu 4 mẫu giày thể thao NewMos thực tế
-- Hệ quản trị cơ sở dữ liệu: PostgreSQL 16+ / newmos_db
-- Đảm bảo tính Idempotent: có thể chạy nhiều lần không gây duplicate dữ liệu
-- ==============================================================================

-- 1. Tự động chèn / cập nhật Hãng NewMos Sport
INSERT INTO brands (name, code, description, logo_url, website_url, is_active, created_at, updated_at)
VALUES (
    'NewMos Sport',
    'NEWMOS',
    'Thương hiệu giày thể thao công nghệ NewMos - Thiết kế chuẩn phom chân châu Á cùng công nghệ phân tích AI thông minh.',
    '/images/products/navy/thumbnail.png',
    'https://newmos.vn',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    updated_at = NOW();

-- 2. Tự động chèn / cập nhật các Danh mục (Categories) liên quan
INSERT INTO categories (name, slug, description, is_active, created_at, updated_at)
VALUES 
    ('Giày Chạy Bộ (Running)', 'running', 'Các dòng giày chuyên dụng cho chạy bộ, thiết kế đệm trợ lực êm ái bảo vệ khớp gối.', true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

INSERT INTO categories (name, slug, description, is_active, created_at, updated_at)
VALUES 
    ('Giày Chạy Bộ & Tập Luyện', 'running-training', 'Dòng giày đa năng kết hợp chạy bộ cự ly ngắn và các bài tập rèn luyện thể lực.', true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

INSERT INTO categories (name, slug, description, is_active, created_at, updated_at)
VALUES 
    ('Giày Thể Thao Đa Năng', 'the-thao-da-nang', 'Thiết kế tối ưu lực đẩy bàn chân, phù hợp đa dạng hoạt động thể thao ngoài trời và trong nhà.', true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

INSERT INTO categories (name, slug, description, is_active, created_at, updated_at)
VALUES 
    ('Giày Thể Thao Thời Trang & Chạy Bộ', 'thoi-trang-chay-bo', 'Phong cách cổ điển kết hợp hiện đại, ôm gọn cổ chân và dễ dàng phối đồ hằng ngày.', true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

-- 3. Khởi tạo / Cập nhật 4 Sản Phẩm & Các Biến Thể Chi Tiết qua PL/pgSQL
DO $$
DECLARE
    v_brand_id bigint;
    v_cat_running_id bigint;
    v_cat_training_id bigint;
    v_cat_danang_id bigint;
    v_cat_fashion_id bigint;

    v_prod1_id bigint;
    v_prod2_id bigint;
    v_prod3_id bigint;
    v_prod4_id bigint;
    v_var_id bigint;

    v_sizes text[] := ARRAY['36', '37', '38', '39', '40'];
    v_us_sizes text[] := ARRAY['5.0', '5.5', '6.0', '6.5', '7.5'];
    i int;
BEGIN
    -- Lấy ID của Hãng và Danh mục
    SELECT id INTO v_brand_id FROM brands WHERE code = 'NEWMOS';
    SELECT id INTO v_cat_running_id FROM categories WHERE slug = 'running';
    SELECT id INTO v_cat_training_id FROM categories WHERE slug = 'running-training';
    SELECT id INTO v_cat_danang_id FROM categories WHERE slug = 'the-thao-da-nang';
    SELECT id INTO v_cat_fashion_id FROM categories WHERE slug = 'thoi-trang-chay-bo';

    -- =========================================================================
    -- SẢN PHẨM 1: NewMos Runner X - Trắng Hồng (White / Pink)
    -- =========================================================================
    INSERT INTO products (name, code, slug, description, material, gender, brand_id, category_id, is_featured, is_active, created_at, updated_at)
    VALUES (
        'NewMos Runner X - Trắng Hồng (White / Pink)',
        'NM-RUNNER-X-PK',
        'newmos-runner-x-trang-hong',
        'Thiết kế thể thao năng động phối màu Trắng - Hồng trẻ trung, đệm êm giảm chấn, hỗ trợ đo size chân bằng AI chuẩn xác.',
        'Vải dệt Flyknit thoáng khí & Đệm bọt EVA trợ lực',
        'UNISEX',
        v_brand_id,
        v_cat_running_id,
        true,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        description = EXCLUDED.description,
        material = EXCLUDED.material,
        brand_id = EXCLUDED.brand_id,
        category_id = EXCLUDED.category_id,
        is_featured = EXCLUDED.is_featured,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING id INTO v_prod1_id;

    -- Tạo 5 biến thể size 36 - 40 cho Sản phẩm 1
    FOR i IN 1..5 LOOP
        INSERT INTO product_variants (
            product_id, sku, color, color_code, size_eu, size_us, price, original_price, stock_quantity, thumbnail_url, is_active, created_at, updated_at
        ) VALUES (
            v_prod1_id,
            'NM-PK-' || v_sizes[i],
            'Trắng Hồng',
            '#FFB6C1',
            v_sizes[i],
            v_us_sizes[i],
            1250000.00,
            1450000.00,
            15,
            '/images/products/pink/cover.jpg',
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (sku) DO UPDATE SET
            price = EXCLUDED.price,
            original_price = EXCLUDED.original_price,
            stock_quantity = EXCLUDED.stock_quantity,
            thumbnail_url = EXCLUDED.thumbnail_url,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
        RETURNING id INTO v_var_id;

        -- Chèn ảnh chi tiết vào product_variant_images (xóa cũ nếu có để tránh trùng lặp)
        DELETE FROM product_variant_images WHERE variant_id = v_var_id;
        INSERT INTO product_variant_images (variant_id, image_url) VALUES
            (v_var_id, '/images/products/pink/cover.jpg'),
            (v_var_id, '/images/products/pink/poster.jpg'),
            (v_var_id, '/images/products/pink/detail-1.jpg'),
            (v_var_id, '/images/products/pink/detail-2.jpg'),
            (v_var_id, '/images/products/pink/angle-1.jpg'),
            (v_var_id, '/images/products/pink/angle-2.jpg');
    END LOOP;

    -- =========================================================================
    -- SẢN PHẨM 2: NewMos Runner Pro - Trắng Xanh Ngọc (White / Mint Green)
    -- =========================================================================
    INSERT INTO products (name, code, slug, description, material, gender, brand_id, category_id, is_featured, is_active, created_at, updated_at)
    VALUES (
        'NewMos Runner Pro - Trắng Xanh Ngọc (White / Mint Green)',
        'NM-RUNNER-PRO-MG',
        'newmos-runner-pro-trang-xanh-ngoc',
        'Phối màu Trắng Xanh Ngọc thanh lịch, mặt lưới thoáng khí tối đa, đế bám đường chống trơn trượt hiệu quả.',
        'Lưới Mesh thoáng khí & Đế cao su lưu hóa chống trơn trượt',
        'UNISEX',
        v_brand_id,
        v_cat_training_id,
        true,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        description = EXCLUDED.description,
        material = EXCLUDED.material,
        brand_id = EXCLUDED.brand_id,
        category_id = EXCLUDED.category_id,
        is_featured = EXCLUDED.is_featured,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING id INTO v_prod2_id;

    -- Tạo 5 biến thể size 36 - 40 cho Sản phẩm 2
    FOR i IN 1..5 LOOP
        INSERT INTO product_variants (
            product_id, sku, color, color_code, size_eu, size_us, price, original_price, stock_quantity, thumbnail_url, is_active, created_at, updated_at
        ) VALUES (
            v_prod2_id,
            'NM-MG-' || v_sizes[i],
            'Trắng Xanh Ngọc',
            '#48D1CC',
            v_sizes[i],
            v_us_sizes[i],
            1350000.00,
            1550000.00,
            20,
            '/images/products/mint/cover.jpg',
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (sku) DO UPDATE SET
            price = EXCLUDED.price,
            original_price = EXCLUDED.original_price,
            stock_quantity = EXCLUDED.stock_quantity,
            thumbnail_url = EXCLUDED.thumbnail_url,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
        RETURNING id INTO v_var_id;

        DELETE FROM product_variant_images WHERE variant_id = v_var_id;
        INSERT INTO product_variant_images (variant_id, image_url) VALUES
            (v_var_id, '/images/products/mint/cover.jpg'),
            (v_var_id, '/images/products/mint/poster.jpg'),
            (v_var_id, '/images/products/mint/detail-1.jpg'),
            (v_var_id, '/images/products/mint/detail-2.jpg'),
            (v_var_id, '/images/products/mint/ig-10.png'),
            (v_var_id, '/images/products/mint/angle-1.jpg'),
            (v_var_id, '/images/products/mint/angle-2.jpg');
    END LOOP;

    -- =========================================================================
    -- SẢN PHẨM 3: NewMos Air Speed - Trắng Xanh Dương (White / Ocean Blue)
    -- =========================================================================
    INSERT INTO products (name, code, slug, description, material, gender, brand_id, category_id, is_featured, is_active, created_at, updated_at)
    VALUES (
        'NewMos Air Speed - Trắng Xanh Dương (White / Ocean Blue)',
        'NM-AIR-SPEED-BL',
        'newmos-air-speed-trang-xanh-duong',
        'Tông màu Trắng kết hợp Xanh Dương khỏe khoắn, đệm bọt khí đàn hồi cao, thiết kế tối ưu lực đẩy bàn chân.',
        'Vải dệt Mesh kỹ thuật số & Đệm khí Air đàn hồi cao',
        'UNISEX',
        v_brand_id,
        v_cat_danang_id,
        true,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        description = EXCLUDED.description,
        material = EXCLUDED.material,
        brand_id = EXCLUDED.brand_id,
        category_id = EXCLUDED.category_id,
        is_featured = EXCLUDED.is_featured,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING id INTO v_prod3_id;

    -- Tạo 5 biến thể size 36 - 40 cho Sản phẩm 3
    FOR i IN 1..5 LOOP
        INSERT INTO product_variants (
            product_id, sku, color, color_code, size_eu, size_us, price, original_price, stock_quantity, thumbnail_url, is_active, created_at, updated_at
        ) VALUES (
            v_prod3_id,
            'NM-BL-' || v_sizes[i],
            'Trắng Xanh Dương',
            '#0077B6',
            v_sizes[i],
            v_us_sizes[i],
            1390000.00,
            1590000.00,
            18,
            '/images/products/ocean/cover.jpg',
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (sku) DO UPDATE SET
            price = EXCLUDED.price,
            original_price = EXCLUDED.original_price,
            stock_quantity = EXCLUDED.stock_quantity,
            thumbnail_url = EXCLUDED.thumbnail_url,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
        RETURNING id INTO v_var_id;

        DELETE FROM product_variant_images WHERE variant_id = v_var_id;
        INSERT INTO product_variant_images (variant_id, image_url) VALUES
            (v_var_id, '/images/products/ocean/cover.jpg'),
            (v_var_id, '/images/products/ocean/poster.png'),
            (v_var_id, '/images/products/ocean/tech-sole.png'),
            (v_var_id, '/images/products/ocean/tech-upper.png'),
            (v_var_id, '/images/products/ocean/tech-heel.png'),
            (v_var_id, '/images/products/ocean/angle-1.jpg'),
            (v_var_id, '/images/products/ocean/angle-2.jpg');
    END LOOP;

    -- =========================================================================
    -- SẢN PHẨM 4: NewMos Apex Court - Trắng Xanh Navy (White / Navy)
    -- =========================================================================
    INSERT INTO products (name, code, slug, description, material, gender, brand_id, category_id, is_featured, is_active, created_at, updated_at)
    VALUES (
        'NewMos Apex Court - Trắng Xanh Navy (White / Navy)',
        'NM-APEX-COURT-NV',
        'newmos-apex-court-trang-xanh-navy',
        'Phong cách cổ điển pha hiện đại với viền Xanh Navy đậm nét, form ôm chuẩn bàn chân châu Á theo phân tích AI.',
        'Da cao cấp phối nỉ & Đế Cupsole cổ điển',
        'UNISEX',
        v_brand_id,
        v_cat_fashion_id,
        true,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        description = EXCLUDED.description,
        material = EXCLUDED.material,
        brand_id = EXCLUDED.brand_id,
        category_id = EXCLUDED.category_id,
        is_featured = EXCLUDED.is_featured,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING id INTO v_prod4_id;

    -- Tạo 5 biến thể size 36 - 40 cho Sản phẩm 4
    FOR i IN 1..5 LOOP
        INSERT INTO product_variants (
            product_id, sku, color, color_code, size_eu, size_us, price, original_price, stock_quantity, thumbnail_url, is_active, created_at, updated_at
        ) VALUES (
            v_prod4_id,
            'NM-NV-' || v_sizes[i],
            'Trắng Navy',
            '#001F3F',
            v_sizes[i],
            v_us_sizes[i],
            1450000.00,
            1650000.00,
            12,
            '/images/products/navy/cover.png',
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (sku) DO UPDATE SET
            price = EXCLUDED.price,
            original_price = EXCLUDED.original_price,
            stock_quantity = EXCLUDED.stock_quantity,
            thumbnail_url = EXCLUDED.thumbnail_url,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
        RETURNING id INTO v_var_id;

        DELETE FROM product_variant_images WHERE variant_id = v_var_id;
        INSERT INTO product_variant_images (variant_id, image_url) VALUES
            (v_var_id, '/images/products/navy/cover.png'),
            (v_var_id, '/images/products/navy/poster.png'),
            (v_var_id, '/images/products/navy/detail-2.png'),
            (v_var_id, '/images/products/navy/detail-3.png'),
            (v_var_id, '/images/products/navy/ig-2.png'),
            (v_var_id, '/images/products/navy/angle-1.jpg'),
            (v_var_id, '/images/products/navy/angle-2.jpg');
    END LOOP;

    RAISE NOTICE 'Hoàn thành nạp 4 mẫu giày NewMos và 20 biến thể SKU thành công!';
END $$;
