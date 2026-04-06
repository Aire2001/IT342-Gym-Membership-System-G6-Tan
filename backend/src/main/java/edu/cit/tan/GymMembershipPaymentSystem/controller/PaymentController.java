package edu.cit.tan.GymMembershipPaymentSystem.controller;

import edu.cit.tan.GymMembershipPaymentSystem.dto.ApiResponse;
import edu.cit.tan.GymMembershipPaymentSystem.dto.PaymentRequest;
import edu.cit.tan.GymMembershipPaymentSystem.entity.Payment;
import edu.cit.tan.GymMembershipPaymentSystem.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.repository.PaymentRepository;
import edu.cit.tan.GymMembershipPaymentSystem.repository.UserRepository;
import edu.cit.tan.GymMembershipPaymentSystem.service.payment.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@CrossOrigin(origins = "http://localhost:5173")
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    @Autowired
    public PaymentController(PaymentService paymentService, PaymentRepository paymentRepository, UserRepository userRepository) {
        this.paymentService = paymentService;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
    }

    // Test endpoint to check if payment controller is working
    @GetMapping("/test")
    public ApiResponse<String> test() {
        return ApiResponse.success("Payment controller is working!");
    }

    // Create a new payment using the Facade Service Pattern
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createPayment(@RequestBody PaymentRequest request) {
        try {
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            Map<String, Object> response = paymentService.processPayment(request, userDetails.getUsername());
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            System.err.println("❌ PAYMENT ERROR: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorDetails = new HashMap<>();
            errorDetails.put("exception", e.getClass().getSimpleName());
            errorDetails.put("message", e.getMessage());

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("PAY-001", "Payment failed: " + e.getMessage(), errorDetails));
        }
    }

    // Get payment history for current user
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<Payment>>> getPaymentHistory() {
        try {
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Payment> payments = paymentRepository.findByUserId(user.getId());

            return ResponseEntity.ok(ApiResponse.success(payments));

        } catch (Exception e) {
            System.err.println("❌ Error fetching payment history: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("DB-001", "Error fetching payments: " + e.getMessage(), null));
        }
    }

    // Get payment by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Payment>> getPaymentById(@PathVariable Long id) {
        try {
            Payment payment = paymentService.getPaymentById(id);

            if (payment == null) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("DB-001", "Payment not found with id: " + id, null));
            }

            return ResponseEntity.ok(ApiResponse.success(payment));

        } catch (Exception e) {
            System.err.println("❌ Error fetching payment: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("DB-001", "Error fetching payment: " + e.getMessage(), null));
        }
    }

    // Admin endpoint to get all payments
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Payment>>> getAllPayments() {
        try {
            List<Payment> payments = paymentRepository.findAll();
            return ResponseEntity.ok(ApiResponse.success(payments));
        } catch (Exception e) {
            System.err.println("❌ Error fetching all payments: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("DB-001", "Error fetching all payments: " + e.getMessage(), null));
        }
    }

    // Get payment statistics for admin dashboard
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentStats() {
        try {
            List<Payment> allPayments = paymentRepository.findAll();
            long totalPayments = allPayments.size();
            double totalRevenue = allPayments.stream()
                    .filter(p -> "COMPLETED".equals(p.getPaymentStatus()))
                    .mapToDouble(p -> p.getAmount().doubleValue())
                    .sum();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalPayments", totalPayments);
            stats.put("totalRevenue", totalRevenue);
            stats.put("completedPayments", allPayments.stream().filter(p -> "COMPLETED".equals(p.getPaymentStatus())).count());
            stats.put("pendingPayments", allPayments.stream().filter(p -> "PENDING".equals(p.getPaymentStatus())).count());

            return ResponseEntity.ok(ApiResponse.success(stats));

        } catch (Exception e) {
            System.err.println("❌ Error fetching payment stats: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("DB-001", "Error fetching stats: " + e.getMessage(), null));
        }
    }
}