package com.shoestore.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "BearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("KICKS.VN // Nền Tảng Thương Mại Điện Tử Giày Thể Thao Tích Hợp AI")
                        .description("Tài liệu đặc tả toàn bộ RESTful API của hệ thống KICKS.VN bao gồm xác thực JWT, " +
                                "danh mục sản phẩm, biến thể SKU, quy trình đặt hàng, thanh toán VietQR và thuật toán gợi ý size chân AI.")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("KICKS.VN Engineering Team")
                                .email("engineering@shoestore.com")
                                .url("https://kicks.vn"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("http://springdoc.org")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Nhập JWT Access Token vào ô bên dưới theo định dạng: Bearer <token>")));
    }
}
