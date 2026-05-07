package edu.cit.tan.GymMembershipPaymentSystem.feature.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.UserRole;
import edu.cit.tan.GymMembershipPaymentSystem.shared.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String TEST_EMAIL = "paytest@test.com";
    private static final String TEST_PASSWORD = "password123";

    @BeforeEach
    void setUp() {
        if (!userRepository.existsByEmail(TEST_EMAIL)) {
            User user = new User();
            user.setFirstname("Pay");
            user.setLastname("Tester");
            user.setEmail(TEST_EMAIL);
            user.setPasswordHash(passwordEncoder.encode(TEST_PASSWORD));
            user.setRole(UserRole.USER);
            userRepository.save(user);
        }
    }

    // ── TC-PAY-001 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-PAY-001: GET /api/v1/payments/history without auth returns 401/403")
    void getPaymentHistory_withoutAuth_returns401Or403() throws Exception {
        mockMvc.perform(get("/api/v1/payments/history"))
                .andExpect(result ->
                        org.junit.jupiter.api.Assertions.assertTrue(
                                result.getResponse().getStatus() == 401 ||
                                result.getResponse().getStatus() == 403,
                                "Expected 401 or 403 but got: " + result.getResponse().getStatus()
                        )
                );
    }

    // ── TC-PAY-002 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-PAY-002: GET /api/v1/payments/history with mock user returns 200")
    @WithMockUser(username = "paytest@test.com", roles = "USER")
    void getPaymentHistory_withMockUser_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/payments/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    // ── TC-PAY-003 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-PAY-003: POST /api/v1/payments without auth returns 401/403")
    void createPayment_withoutAuth_returns401Or403() throws Exception {
        Map<String, Object> body = Map.of(
                "membershipId", 1,
                "amount", 1500.00,
                "paymentMethod", "GCASH"
        );

        mockMvc.perform(post("/api/v1/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(result ->
                        org.junit.jupiter.api.Assertions.assertTrue(
                                result.getResponse().getStatus() == 401 ||
                                result.getResponse().getStatus() == 403,
                                "Expected 401 or 403 but got: " + result.getResponse().getStatus()
                        )
                );
    }

    // ── TC-PAY-004 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-PAY-004: POST /api/v1/payments with mock user and valid data returns 200")
    @WithMockUser(username = "paytest@test.com", roles = "USER")
    void createPayment_withMockUserAndGcash_returns200() throws Exception {
        Map<String, Object> body = Map.of(
                "membershipId", 1L,
                "amount", 1500.00,
                "paymentMethod", "GCASH"
        );

        mockMvc.perform(post("/api/v1/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paymentReference").isNotEmpty())
                .andExpect(jsonPath("$.data.paymentStatus").value("COMPLETED"));
    }

    // ── TC-PAY-005 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-PAY-005: POST /api/v1/payments with Bank Transfer sets status PENDING")
    @WithMockUser(username = "paytest@test.com", roles = "USER")
    void createPayment_bankTransfer_setsPendingStatus() throws Exception {
        Map<String, Object> body = Map.of(
                "membershipId", 1L,
                "amount", 1500.00,
                "paymentMethod", "Bank Transfer"
        );

        mockMvc.perform(post("/api/v1/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paymentStatus").value("PENDING"));
    }

    // ── TC-PAY-006 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-PAY-006: GET /api/v1/payments/test returns 200")
    @WithMockUser(roles = "USER")
    void paymentTestEndpoint_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/payments/test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value("Payment controller is working!"));
    }
}
