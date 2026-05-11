package edu.cit.tan.GymMembershipPaymentSystem.feature.auth;

import edu.cit.tan.GymMembershipPaymentSystem.feature.auth.LoginRequest;
import edu.cit.tan.GymMembershipPaymentSystem.feature.auth.RegisterRequest;
import edu.cit.tan.GymMembershipPaymentSystem.shared.dto.ApiResponse;
import edu.cit.tan.GymMembershipPaymentSystem.feature.auth.AuthResponse;
import edu.cit.tan.GymMembershipPaymentSystem.feature.auth.AuthService;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.shared.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private OAuthService oAuthService;

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
    public ResponseEntity<ApiResponse<?>> logout() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null) {
                authService.logout(auth.getName());
            }
            return ResponseEntity.ok(ApiResponse.success("User successfully logged out"));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.success("Logged out"));
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

    @PostMapping("/oauth/google")
    public ResponseEntity<ApiResponse<?>> googleLogin(@RequestBody Map<String, String> body) {
        try {
            String idToken = body.get("idToken");
            if (idToken == null || idToken.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "idToken is required", null));
            }
            Map<String, Object> data = oAuthService.googleLogin(idToken);
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("AUTH-001", e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("SYSTEM-001", "OAuth failed: " + e.getMessage(), null));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMe() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            data.put("email", user.getEmail());
            data.put("firstname", user.getFirstname());
            data.put("lastname", user.getLastname());
            data.put("role", user.getRole().toString());
            data.put("profilePicture", user.getProfilePicture());
            data.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("ERR-001", e.getMessage(), null));
        }
    }

    @GetMapping("/test")
    public ResponseEntity<ApiResponse<String>> test() {
        return ResponseEntity.ok(ApiResponse.success(
                "Gym Membership Payment System Auth API is working!"
        ));
    }
}