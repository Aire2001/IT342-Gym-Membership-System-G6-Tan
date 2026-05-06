package edu.cit.tan.GymMembershipPaymentSystem.service;

import edu.cit.tan.GymMembershipPaymentSystem.dto.AuthResponse;
import edu.cit.tan.GymMembershipPaymentSystem.dto.LoginRequest;
import edu.cit.tan.GymMembershipPaymentSystem.dto.RegisterRequest;
import edu.cit.tan.GymMembershipPaymentSystem.entity.AuthToken;
import edu.cit.tan.GymMembershipPaymentSystem.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.entity.UserRole;
import edu.cit.tan.GymMembershipPaymentSystem.repository.AuthTokenRepository;
import edu.cit.tan.GymMembershipPaymentSystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthTokenRepository authTokenRepository;

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

            // Generate and store access token
            String accessToken = generateAndStoreToken(savedUser);
            String refreshToken = UUID.randomUUID().toString();

            // Prepare response data
            data.put("userId", savedUser.getId());
            data.put("email", savedUser.getEmail());
            data.put("role", savedUser.getRole().toString());
            data.put("firstname", savedUser.getFirstname());
            data.put("lastname", savedUser.getLastname());
            data.put("accessToken", accessToken);
            data.put("refreshToken", refreshToken);

            System.out.println("✅ User registered: " + savedUser.getEmail() + " with token stored in DB");
            return new AuthResponse(true, "Registration successful", data);

        } catch (Exception e) {
            System.err.println("❌ Registration error: " + e.getMessage());
            e.printStackTrace();
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

            // Generate and store token in DB
            String accessToken = generateAndStoreToken(user);
            String refreshToken = UUID.randomUUID().toString();

            // Prepare response data
            data.put("accessToken", accessToken);
            data.put("refreshToken", refreshToken);
            data.put("role", user.getRole().toString());
            data.put("userId", user.getId());
            data.put("email", user.getEmail());
            data.put("firstname", user.getFirstname());
            data.put("lastname", user.getLastname());

            System.out.println("✅ User logged in: " + user.getEmail() + " with new token stored in DB");
            return new AuthResponse(true, "Login successful", data);

        } catch (Exception e) {
            System.err.println("❌ Login error: " + e.getMessage());
            e.printStackTrace();
            return new AuthResponse(false, "Login failed: " + e.getMessage(), null);
        }
    }

    public void logout(String email) {
        try {
            userRepository.findByEmail(email).ifPresent(user -> {
                List<AuthToken> tokens = authTokenRepository.findByUser(user);
                tokens.forEach(t -> t.setValid(false));
                authTokenRepository.saveAll(tokens);
                System.out.println("✅ Invalidated " + tokens.size() + " token(s) for: " + email);
            });
        } catch (Exception e) {
            System.err.println("❌ Logout error: " + e.getMessage());
        }
    }

    public AuthResponse refreshToken(String refreshToken) {
        Map<String, Object> data = new HashMap<>();
        try {
            // Simple refresh - generate a new token
            data.put("accessToken", "refreshed-" + UUID.randomUUID());
            data.put("refreshToken", UUID.randomUUID().toString());
            return new AuthResponse(true, "Token refreshed successfully", data);
        } catch (Exception e) {
            return new AuthResponse(false, "Token refresh failed: " + e.getMessage(), null);
        }
    }

    private String generateAndStoreToken(User user) {
        // Generate a secure random token
        String token = UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();

        // Store it in the database
        AuthToken authToken = new AuthToken(token, user);
        authTokenRepository.save(authToken);

        System.out.println("🔑 Token generated and stored for: " + user.getEmail());
        return token;
    }
}