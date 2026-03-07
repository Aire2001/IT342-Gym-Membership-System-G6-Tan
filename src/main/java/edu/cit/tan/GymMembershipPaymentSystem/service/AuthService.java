package edu.cit.tan.GymMembershipPaymentSystem.service;

import edu.cit.tan.GymMembershipPaymentSystem.dto.LoginRequest;
import edu.cit.tan.GymMembershipPaymentSystem.dto.LoginResponse;
import edu.cit.tan.GymMembershipPaymentSystem.dto.RegisterRequest;
import edu.cit.tan.GymMembershipPaymentSystem.dto.UserResponse;
import edu.cit.tan.GymMembershipPaymentSystem.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.exception.DuplicateEmailException;
import edu.cit.tan.GymMembershipPaymentSystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    public UserResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("Email already registered: " + request.getEmail());
        }

        // Create new user
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Save user to database
        User savedUser = userRepository.save(user);

        // Return response
        return new UserResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                "User registered successfully"
        );
    }

    public LoginResponse login(LoginRequest request) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Get user details
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Create user response
            UserResponse userResponse = new UserResponse(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    "Login successful"
            );

            return new LoginResponse(
                    "Login successful",
                    true,
                    userResponse,
                    "dummy-jwt-token" // In production, generate actual JWT
            );

        } catch (BadCredentialsException e) {
            return new LoginResponse(
                    "Invalid email or password",
                    false,
                    null,
                    null
            );
        } catch (Exception e) {
            return new LoginResponse(
                    "Login failed: " + e.getMessage(),
                    false,
                    null,
                    null
            );
        }
    }
}