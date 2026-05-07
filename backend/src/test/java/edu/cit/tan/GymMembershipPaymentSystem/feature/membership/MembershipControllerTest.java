package edu.cit.tan.GymMembershipPaymentSystem.feature.membership;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class MembershipControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ── TC-MEM-001 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-MEM-001: GET /api/v1/memberships returns 200 with seeded plans")
    void getAllMemberships_returns200WithPlans() throws Exception {
        mockMvc.perform(get("/api/v1/memberships"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(3));
    }

    // ── TC-MEM-002 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-MEM-002: GET /api/v1/memberships returns plans with correct fields")
    void getAllMemberships_returnsCorrectFields() throws Exception {
        mockMvc.perform(get("/api/v1/memberships"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").isNotEmpty())
                .andExpect(jsonPath("$.data[0].price").isNotEmpty())
                .andExpect(jsonPath("$.data[0].durationMonths").isNumber());
    }

    // ── TC-MEM-003 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-MEM-003: GET /api/v1/memberships/{id} with invalid id returns error")
    void getMembershipById_notFound_returnsError() throws Exception {
        mockMvc.perform(get("/api/v1/memberships/99999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.error").isNotEmpty());
    }

    // ── TC-MEM-004 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-MEM-004: POST /api/v1/memberships without ADMIN role returns 403")
    @WithMockUser(roles = "USER")
    void createMembership_withUserRole_returns403() throws Exception {
        Map<String, Object> body = Map.of(
                "name", "Test Plan",
                "durationMonths", 3,
                "price", 3000.00,
                "description", "Test description"
        );

        mockMvc.perform(post("/api/v1/memberships")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }

    // ── TC-MEM-005 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-MEM-005: POST /api/v1/memberships with ADMIN role returns 200")
    @WithMockUser(roles = "ADMIN")
    void createMembership_withAdminRole_returns200() throws Exception {
        Map<String, Object> body = Map.of(
                "name", "Gold Plan",
                "durationMonths", 3,
                "price", 3500.00,
                "description", "3-month gold membership"
        );

        mockMvc.perform(post("/api/v1/memberships")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Gold Plan"))
                .andExpect(jsonPath("$.data.durationMonths").value(3));
    }

    // ── TC-MEM-006 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-MEM-006: DELETE /api/v1/memberships/{id} without auth returns 403")
    void deleteMembership_withoutAuth_returns403() throws Exception {
        mockMvc.perform(delete("/api/v1/memberships/1"))
                .andExpect(status().isForbidden());
    }
}
