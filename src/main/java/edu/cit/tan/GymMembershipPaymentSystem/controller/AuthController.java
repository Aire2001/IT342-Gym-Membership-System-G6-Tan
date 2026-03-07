package edu.cit.tan.GymMembershipPaymentSystem.controller;

import edu.cit.tan.GymMembershipPaymentSystem.dto.LoginRequest;
import edu.cit.tan.GymMembershipPaymentSystem.dto.LoginResponse;
import edu.cit.tan.GymMembershipPaymentSystem.dto.RegisterRequest;
import edu.cit.tan.GymMembershipPaymentSystem.dto.UserResponse;
import edu.cit.tan.GymMembershipPaymentSystem.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            UserResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/test")
    public String test() {
        return "Gym Membership Payment System Auth API is working!";
    }
}