package edu.cit.tan.GymMembershipPaymentSystem.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")  // Changed from "/api/**" to "/**" to cover all endpoints
                .allowedOrigins(
                                "http://localhost:5173",
                        "http://localhost:5174",
                        "http://localhost:5175",
                        "http://localhost:3000",
                        "http://localhost:8080",
                        "http://127.0.0.1:5173",  // Added IP version
                        "http://127.0.0.1:5174",
                        "http://127.0.0.1:5175"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")  // Added PATCH
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);  // Add max age for preflight requests
    }
}