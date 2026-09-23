package com.shoestore.security;

import com.shoestore.security.jwt.JwtAuthFilter;
import com.shoestore.security.service.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthEntryPoint unauthorizedHandler;
    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 0. Công khai tài nguyên ảnh tĩnh & WebSocket handshake endpoint
                        .requestMatchers("/images/**", "/static/**", "/favicon.ico").permitAll()
                        .requestMatchers("/ws", "/ws/**", "/ws-sockjs", "/ws-sockjs/**").permitAll()

                        // 1. Mở công khai (permitAll): /api/auth/**, /api/products/**, /api/categories/**, /api/brands/**, /api/chat/**
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/products/**").permitAll()
                        .requestMatchers("/api/categories/**").permitAll()
                        .requestMatchers("/api/brands/**").permitAll()
                        .requestMatchers("/api/chat/**").permitAll()

                        // 2. Công khai các tài liệu API Swagger & Actuator
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/actuator/**"
                        ).permitAll()

                        // 3. Công khai tra cứu đơn hàng và dịch vụ tính toán kích thước AI tức thì
                        .requestMatchers(HttpMethod.POST, "/api/orders").permitAll()
                        .requestMatchers("/api/orders/track/**", "/api/orders/code/**").permitAll()
                        .requestMatchers(
                                "/api/size/**",
                                "/api/ai/calculate-size",
                                "/api/ai/recommend-product-size/**",
                                "/api/ai/sizing",
                                "/api/ai/visual-search",
                                "/api/ai/recommend"
                        ).permitAll()

                        // 4. Giới hạn quyền Admin (hasRole('ADMIN'))
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // 5. Yêu cầu xác thực (authenticated): /api/users/**, /api/profile/**, /api/ai/save-profile, /api/ai/my-profile, /api/orders/my-orders
                        .requestMatchers("/api/users/**", "/api/profile/**").authenticated()
                        .requestMatchers("/api/ai/save-profile", "/api/ai/my-profile", "/api/ai/profiles").authenticated()
                        .requestMatchers("/api/orders/my-orders").authenticated()

                        // 6. Mọi yêu cầu còn lại đều yêu cầu đăng nhập
                        .anyRequest().authenticated()
                );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
