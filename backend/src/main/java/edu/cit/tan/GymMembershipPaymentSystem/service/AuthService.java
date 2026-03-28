package edu.cit.tan.GymMembershipPaymentSystem.service;

import edu.cit.tan.GymMembershipPaymentSystem.dto.AuthResponse;
import edu.cit.tan.GymMembershipPaymentSystem.dto.LoginRequest;
import edu.cit.tan.GymMembershipPaymentSystem.dto.RegisterRequest;
import edu.cit.tan.GymMembershipPaymentSystem.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.entity.UserRole;
import edu.cit.tan.GymMembershipPaymentSystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public AuthResponse register(RegisterRequest request) {
        Map<String, Object> data = new HashMap<>();

        try {
            // Check if email already exists
            if (userRepository.existsByEmail(request.getEmail())) {
                return new AuthResponse(false, "Email already registered", null);
            }

            // Create new user
            User user = new User();
            user.setFirstname(request.getFirstname());
            user.setLastname(request.getLastname());
            user.setEmail(request.getEmail());
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setRole(UserRole.USER);

            // Save user to database
            User savedUser = userRepository.save(user);

            // Prepare response data
            data.put("userId", savedUser.getId());
            data.put("email", savedUser.getEmail());
            data.put("role", savedUser.getRole().toString());
            data.put("firstname", savedUser.getFirstname());
            data.put("lastname", savedUser.getLastname());

            return new AuthResponse(true, "Registration successful", data);

        } catch (Exception e) {
            return new AuthResponse(false, "Registration failed: " + e.getMessage(), null);
        }
    }

    public AuthResponse login(LoginRequest request) {
        Map<String, Object> data = new HashMap<>();

        try {
            // Find user by email
            User user = userRepository.findByEmail(request.getEmail())
                    .orElse(null);

            // Check if user exists and password matches
            if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                return new AuthResponse(false, "Invalid email or password", null);
            }

            // Generate tokens (you'll implement JWT later)
            String accessToken = generateAccessToken(user);
            String refreshToken = generateRefreshToken(user);

            // Prepare response data
            data.put("accessToken", accessToken);
            data.put("refreshToken", refreshToken);
            data.put("role", user.getRole().toString());
            data.put("userId", user.getId());
            data.put("email", user.getEmail());
            data.put("firstname", user.getFirstname());
            data.put("lastname", user.getLastname());

            return new AuthResponse(true, "Login successful", data);

        } catch (Exception e) {
            return new AuthResponse(false, "Login failed: " + e.getMessage(), null);
        }
    }

    public void logout(String email) {
        // Implement logout logic (invalidate tokens)
        // For now, just log the logout action
        System.out.println("User logged out: " + email);
    }

    public AuthResponse refreshToken(String refreshToken) {
        Map<String, Object> data = new HashMap<>();

        try {
            // Implement token refresh logic
            // For now, return a dummy response
            data.put("accessToken", generateAccessToken(null));
            data.put("refreshToken", generateRefreshToken(null));

            return new AuthResponse(true, "Token refreshed successfully", data);
        } catch (Exception e) {
            return new AuthResponse(false, "Token refresh failed: " + e.getMessage(), null);
        }
    }

    private String generateAccessToken(User user) {
        // You'll implement JWT here
        // For now, return a dummy token
        return "dummy-jwt-token-" + UUID.randomUUID().toString();
    }

    private String generateRefreshToken(User user) {
        // You'll implement refresh token here
        // For now, return a dummy token
        return "dummy-refresh-token-" + UUID.randomUUID().toString();
    }
}