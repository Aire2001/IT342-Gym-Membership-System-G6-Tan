package edu.cit.tan.GymMembershipPaymentSystem.controller;

import edu.cit.tan.GymMembershipPaymentSystem.dto.ApiResponse;
import edu.cit.tan.GymMembershipPaymentSystem.entity.Payment;
import edu.cit.tan.GymMembershipPaymentSystem.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.entity.UserRole;
import edu.cit.tan.GymMembershipPaymentSystem.repository.MembershipRepository;
import edu.cit.tan.GymMembershipPaymentSystem.repository.PaymentRepository;
import edu.cit.tan.GymMembershipPaymentSystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<User>> getAllUsers() {
        try {
            return ApiResponse.success(userRepository.findAll());
        } catch (Exception e) {
            return ApiResponse.error("DB-001", "Error fetching users: " + e.getMessage(), null);
        }
    }

    @GetMapping("/payments")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<Payment>> getAllPayments() {
        try {
            return ApiResponse.success(paymentRepository.findAll());
        } catch (Exception e) {
            return ApiResponse.error("DB-001", "Error fetching payments: " + e.getMessage(), null);
        }
    }

    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Map<String, Object>> getDashboardStats() {
        try {
            List<Payment> payments = paymentRepository.findAll();
            double totalRevenue = payments.stream()
                    .filter(p -> "COMPLETED".equals(p.getPaymentStatus()))
                    .mapToDouble(p -> p.getAmount().doubleValue())
                    .sum();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", userRepository.count());
            stats.put("totalPayments", paymentRepository.count());
            stats.put("totalMemberships", membershipRepository.count());
            stats.put("totalRevenue", totalRevenue);

            return ApiResponse.success(stats);
        } catch (Exception e) {
            return ApiResponse.error("DB-001", "Error fetching stats: " + e.getMessage(), null);
        }
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<User> getUserById(@PathVariable Long id) {
        try {
            return userRepository.findById(id)
                    .map(ApiResponse::success)
                    .orElse(ApiResponse.error("DB-001", "User not found with id: " + id, null));
        } catch (Exception e) {
            return ApiResponse.error("DB-001", "Error fetching user: " + e.getMessage(), null);
        }
    }

    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<User> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ApiResponse.error("DB-001", "User not found with id: " + id, null);
            }

            String newRole = request.get("role");
            if (newRole != null && !newRole.isBlank()) {
                user.setRole(UserRole.valueOf(newRole.toUpperCase()));
                userRepository.save(user);
            }

            return ApiResponse.success(user);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("VALID-001", "Invalid role value. Use USER or ADMIN.", null);
        } catch (Exception e) {
            return ApiResponse.error("DB-001", "Error updating user role: " + e.getMessage(), null);
        }
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> deleteUser(@PathVariable Long id) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ApiResponse.error("DB-001", "User not found with id: " + id, null);
            }
            userRepository.delete(user);
            return ApiResponse.success("User deleted successfully");
        } catch (Exception e) {
            return ApiResponse.error("DB-001", "Error deleting user: " + e.getMessage(), null);
        }
    }

    @PutMapping("/payments/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> updatePaymentStatus(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            Payment payment = paymentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Payment not found"));
            String newStatus = body.get("status");
            if (newStatus == null || newStatus.isBlank())
                return ResponseEntity.badRequest().body(ApiResponse.error("VALID-001", "Status is required", null));
            payment.setPaymentStatus(newStatus.toUpperCase());
            paymentRepository.save(payment);
            return ResponseEntity.ok(ApiResponse.success("Payment status updated to " + newStatus));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("DB-001", e.getMessage(), null));
        }
    }

    @DeleteMapping("/payments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deletePayment(@PathVariable Long id) {
        try {
            if (!paymentRepository.existsById(id))
                return ResponseEntity.badRequest().body(ApiResponse.error("DB-001", "Payment not found", null));
            paymentRepository.deleteById(id);
            return ResponseEntity.ok(ApiResponse.success("Payment deleted"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("DB-001", e.getMessage(), null));
        }
    }
}
