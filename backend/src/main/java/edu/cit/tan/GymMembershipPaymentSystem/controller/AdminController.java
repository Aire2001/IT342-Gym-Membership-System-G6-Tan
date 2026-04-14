package edu.cit.tan.GymMembershipPaymentSystem.controller;

import edu.cit.tan.GymMembershipPaymentSystem.dto.ApiResponse;
import edu.cit.tan.GymMembershipPaymentSystem.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.entity.Payment;
import edu.cit.tan.GymMembershipPaymentSystem.entity.Membership;
import edu.cit.tan.GymMembershipPaymentSystem.repository.UserRepository;
import edu.cit.tan.GymMembershipPaymentSystem.repository.PaymentRepository;  // Add this import
import edu.cit.tan.GymMembershipPaymentSystem.repository.MembershipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"})
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PaymentRepository paymentRepository;  // Now this will work

    @Autowired
    private MembershipRepository membershipRepository;

    // Get all users (for admin dashboard)
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<User>> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            return ApiResponse.success(users);
        } catch (Exception e) {
            return ApiResponse.error("DB-001", "Error fetching users: " + e.getMessage(), null);
        }
    }

    // Get all payments (for admin dashboard)
    @GetMapping("/payments")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<Payment>> getAllPayments() {
        try {
            List<Payment> payments = paymentRepository.findAll();
            return ApiResponse.success(payments);
        } catch (Exception e) {
            return ApiResponse.error("DB-001", "Error fetching payments: " + e.getMessage(), null);
        }
    }

    // Get dashboard statistics
    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Map<String, Object>> getDashboardStats() {
        try {
            Map<String, Object> stats = new HashMap<>();

            long totalUsers = userRepository.count();
            long totalPayments = paymentRepository.count();
            long totalMemberships = membershipRepository.count();

            // Calculate total revenue
            List<Payment> payments = paymentRepository.findAll();
            double totalRevenue = payments.stream()
                    .filter(p -> "COMPLETED".equals(p.getPaymentStatus()))
                    .mapToDouble(p -> p.getAmount().doubleValue())
                    .sum();

            stats.put("totalUsers", totalUsers);
            stats.put("totalPayments", totalPayments);
            stats.put("totalMemberships", totalMemberships);
            stats.put("totalRevenue", totalRevenue);

            return ApiResponse.success(stats);
        } catch (Exception e) {
            return ApiResponse.error("DB-001", "Error fetching stats: " + e.getMessage(), null);
        }
    }

    // Get user details by ID
    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<User> getUserById(@PathVariable Long id) {
        try {
            User user = userRepository.findById(id)
                    .orElse(null);

            if (user == null) {
                return ApiResponse.error("DB-001", "User not found with id: " + id, null);
            }

            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error("DB-001", "Error fetching user: " + e.getMessage(), null);
        }
    }

    // Update user role
    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<User> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            User user = userRepository.findById(id)
                    .orElse(null);

            if (user == null) {
                return ApiResponse.error("DB-001", "User not found with id: " + id, null);
            }

            String newRole = request.get("role");
            if (newRole != null) {
                // You need to import UserRole enum
                // user.setRole(UserRole.valueOf(newRole));
                userRepository.save(user);
            }

            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error("DB-001", "Error updating user role: " + e.getMessage(), null);
        }
    }

    // Delete user
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> deleteUser(@PathVariable Long id) {
        try {
            User user = userRepository.findById(id)
                    .orElse(null);

            if (user == null) {
                return ApiResponse.error("DB-001", "User not found with id: " + id, null);
            }

            userRepository.delete(user);
            return ApiResponse.success("User deleted successfully");
        } catch (Exception e) {
            return ApiResponse.error("DB-001", "Error deleting user: " + e.getMessage(), null);
        }
    }
}