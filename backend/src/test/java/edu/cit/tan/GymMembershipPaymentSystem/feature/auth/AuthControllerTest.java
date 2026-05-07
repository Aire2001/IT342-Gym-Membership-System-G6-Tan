package edu.cit.tan.GymMembershipPaymentSystem.feature.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ── TC-AUTH-001 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-AUTH-001: GET /api/v1/auth/test returns 200 and success message")
    void authTestEndpoint_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/auth/test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value("Gym Membership Payment System Auth API is working!"));
    }

    // ── TC-AUTH-002 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-AUTH-002: POST /api/v1/auth/register with valid data returns 200 and token")
    void register_validData_returns200WithToken() throws Exception {
        Map<String, String> body = Map.of(
                "firstname", "Juan",
                "lastname", "Dela Cruz",
                "email", "juan@test.com",
                "password", "password123",
                "confirmPassword", "password123"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.email").value("juan@test.com"))
                .andExpect(jsonPath("$.data.role").value("USER"));
    }

    // ── TC-AUTH-003 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-AUTH-003: POST /api/v1/auth/register with mismatched passwords returns 400")
    void register_passwordMismatch_returns400() throws Exception {
        Map<String, String> body = Map.of(
                "firstname", "Juan",
                "lastname", "Dela Cruz",
                "email", "juan2@test.com",
                "password", "password123",
                "confirmPassword", "differentPassword"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message").value("Validation failed"))
                .andExpect(jsonPath("$.error.details.confirmPassword").value("Passwords do not match"));
    }

    // ── TC-AUTH-004 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-AUTH-004: POST /api/v1/auth/register with duplicate email returns 400")
    void register_duplicateEmail_returns400() throws Exception {
        Map<String, String> body = Map.of(
                "firstname", "Juan",
                "lastname", "Dela Cruz",
                "email", "dup@test.com",
                "password", "password123",
                "confirmPassword", "password123"
        );

        // First registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk());

        // Duplicate registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message").value("Email already registered"));
    }

    // ── TC-AUTH-005 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-AUTH-005: POST /api/v1/auth/login with valid credentials returns 200 and token")
    void login_validCredentials_returns200WithToken() throws Exception {
        // Register first
        Map<String, String> reg = Map.of(
                "firstname", "Maria",
                "lastname", "Santos",
                "email", "maria@test.com",
                "password", "password123",
                "confirmPassword", "password123"
        );
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isOk());

        // Then login
        Map<String, String> login = Map.of(
                "email", "maria@test.com",
                "password", "password123"
        );
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.email").value("maria@test.com"));
    }

    // ── TC-AUTH-006 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-AUTH-006: POST /api/v1/auth/login with wrong password returns 400")
    void login_wrongPassword_returns400() throws Exception {
        Map<String, String> body = Map.of(
                "email", "notexist@test.com",
                "password", "wrongpassword"
        );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message").value("Invalid email or password"));
    }

    // ── TC-AUTH-007 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-AUTH-007: POST /api/v1/auth/logout without auth returns 200")
    void logout_withoutAuth_returns200() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isOk());
    }
}
