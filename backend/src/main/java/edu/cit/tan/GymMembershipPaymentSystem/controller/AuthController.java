package edu.cit.tan.GymMembershipPaymentSystem.controller;

import edu.cit.tan.GymMembershipPaymentSystem.entity.UserMembership;
import edu.cit.tan.GymMembershipPaymentSystem.repository.UserMembershipRepository;
import edu.cit.tan.GymMembershipPaymentSystem.dto.LoginRequest;
import edu.cit.tan.GymMembershipPaymentSystem.dto.RegisterRequest;
import edu.cit.tan.GymMembershipPaymentSystem.dto.ApiResponse;
import edu.cit.tan.GymMembershipPaymentSystem.dto.AuthResponse;
import edu.cit.tan.GymMembershipPaymentSystem.service.AuthService;
import edu.cit.tan.GymMembershipPaymentSystem.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"})
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserMembershipRepository userMembershipRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error(
                                "VALID-001",
                                "Validation failed",
                                Map.of("confirmPassword", "Passwords do not match")
                        ));
            }

            AuthResponse response = authService.register(request);

            if (response.isSuccess()) {
                return ResponseEntity.ok(ApiResponse.success(response.getData()));
            } else {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error(
                                "VALID-001",
                                response.getMessage(),
                                null
                        ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                            "SYSTEM-001",
                            "Registration failed: " + e.getMessage(),
                            null
                    ));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);

            if (response.isSuccess()) {
                return ResponseEntity.ok(ApiResponse.success(response.getData()));
            } else {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error(
                                "AUTH-001",
                                response.getMessage(),
                                null
                        ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                            "SYSTEM-001",
                            "Login failed: " + e.getMessage(),
                            null
                    ));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<?>> logout(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error(
                                "VALID-001",
                                "Email is required",
                                null
                        ));
            }

            authService.logout(email);
            return ResponseEntity.ok(ApiResponse.success("User successfully logged out"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                            "SYSTEM-001",
                            "Logout failed: " + e.getMessage(),
                            null
                    ));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<?>> refreshToken(@RequestBody Map<String, String> request) {
        try {
            String refreshToken = request.get("refreshToken");
            if (refreshToken == null || refreshToken.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error(
                                "VALID-001",
                                "Refresh token is required",
                                null
                        ));
            }

            AuthResponse response = authService.refreshToken(refreshToken);

            if (response.isSuccess()) {
                return ResponseEntity.ok(ApiResponse.success(response.getData()));
            } else {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error(
                                "AUTH-002",
                                response.getMessage(),
                                null
                        ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                            "SYSTEM-001",
                            "Token refresh failed: " + e.getMessage(),
                            null
                    ));
        }
    }

    @GetMapping("/membership")
    public ResponseEntity<ApiResponse<?>> getUserMembership() {
        try {
            // Get current authenticated user
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String email = userDetails.getUsername();

            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                return ResponseEntity.status(404)
                        .body(ApiResponse.error(
                                "USER-001",
                                "User not found",
                                null
                        ));
            }

            // Get active membership
            UserMembership activeMembership = userMembershipRepository.findByUserAndStatus(user, "Active").orElse(null);

            if (activeMembership == null) {
                return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "hasMembership", false,
                    "message", "No active membership found"
                )));
            }

            // Return membership details
            Map<String, Object> membershipData = Map.of(
                "hasMembership", true,
                "membershipId", activeMembership.getId(),
                "membership", Map.of(
                    "id", activeMembership.getMembership().getId(),
                    "name", activeMembership.getMembership().getName(),
                    "duration_months", activeMembership.getMembership().getDurationMonths(),
                    "price", activeMembership.getMembership().getPrice(),
                    "description", activeMembership.getMembership().getDescription()
                ),
                "start_date", activeMembership.getStartDate().toString(),
                "end_date", activeMembership.getEndDate().toString(),
                "status", activeMembership.getStatus()
            );

            return ResponseEntity.ok(ApiResponse.success(membershipData));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                            "SYSTEM-001",
                            "Failed to get membership: " + e.getMessage(),
                            null
                    ));
        }
    }

    @GetMapping("/test")
    public ResponseEntity<ApiResponse<String>> test() {
        return ResponseEntity.ok(ApiResponse.success(
                "Gym Membership Payment System Auth API is working!"
        ));
    }
}