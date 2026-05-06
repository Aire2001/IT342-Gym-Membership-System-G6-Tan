package edu.cit.tan.GymMembershipPaymentSystem.controller;

import edu.cit.tan.GymMembershipPaymentSystem.dto.ApiResponse;
import edu.cit.tan.GymMembershipPaymentSystem.dto.PaymentRequest;
import edu.cit.tan.GymMembershipPaymentSystem.entity.Payment;
import edu.cit.tan.GymMembershipPaymentSystem.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.entity.Membership;
import edu.cit.tan.GymMembershipPaymentSystem.entity.UserMembership;
import edu.cit.tan.GymMembershipPaymentSystem.repository.PaymentRepository;
import edu.cit.tan.GymMembershipPaymentSystem.repository.UserRepository;
import edu.cit.tan.GymMembershipPaymentSystem.repository.MembershipRepository;
import edu.cit.tan.GymMembershipPaymentSystem.repository.UserMembershipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/payments")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class PaymentController {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private UserMembershipRepository userMembershipRepository;

    // Test endpoint to check if payment controller is working
    @GetMapping("/test")
    public ApiResponse<String> test() {
        return ApiResponse.success("Payment controller is working!");
    }

    // Create a new payment
    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> createPayment(@RequestBody PaymentRequest request) {
        try {
            System.out.println("========================================");
            System.out.println("💰 PAYMENT REQUEST RECEIVED");
            System.out.println("📦 Membership ID: " + request.getMembershipId());
            System.out.println("💰 Amount: ₱" + request.getAmount());
            System.out.println("💳 Payment Method: " + request.getPaymentMethod());
            System.out.println("========================================");

            // Get current user from security context
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            System.out.println("👤 User email from security context: " + userDetails.getUsername());

            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found with email: " + userDetails.getUsername()));

            System.out.println("✅ User found: " + user.getFirstname() + " " + user.getLastname());

            // Get membership
            Membership membership = membershipRepository.findById(request.getMembershipId())
                    .orElseThrow(() -> new RuntimeException("Membership not found with ID: " + request.getMembershipId()));

            System.out.println("✅ Membership found: " + membership.getName() + " (₱" + membership.getPrice() + ")");

            // Generate payment reference
            String paymentReference = "PAY-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
            System.out.println("🔖 Generated Payment Reference: " + paymentReference);

            // Determine payment status based on method
            // Bank Transfer requires manual confirmation → PENDING
            // GCash and Credit Card are processed instantly → COMPLETED
            String paymentStatus;
            String method = request.getPaymentMethod();
            if ("Bank Transfer".equalsIgnoreCase(method)) {
                paymentStatus = "PENDING";
            } else {
                paymentStatus = "COMPLETED";
            }
            System.out.println("💡 Payment status: " + paymentStatus + " (method: " + method + ")");

            // Create payment record
            Payment payment = new Payment();
            payment.setUser(user);
            payment.setMembership(membership);
            payment.setAmount(request.getAmount());
            payment.setPaymentMethod(request.getPaymentMethod());
            payment.setPaymentStatus(paymentStatus);
            payment.setPaymentReference(paymentReference);
            payment.setPaymentDate(LocalDateTime.now());

            Payment savedPayment = paymentRepository.save(payment);
            System.out.println("✅ Payment saved to database with ID: " + savedPayment.getId());

            // Only activate membership when payment is COMPLETED
            LocalDateTime startDate = LocalDateTime.now();
            LocalDateTime endDate = startDate.plusMonths(membership.getDurationMonths());

            if ("COMPLETED".equals(paymentStatus)) {
                // Cancel any existing active membership
                Optional<UserMembership> existingMembership = userMembershipRepository.findByUserAndStatus(user, "Active");
                if (existingMembership.isPresent()) {
                    UserMembership oldMembership = existingMembership.get();
                    oldMembership.setStatus("Cancelled");
                    userMembershipRepository.save(oldMembership);
                    System.out.println("⚙️ Previous active membership cancelled");
                }

                // Create new UserMembership
                UserMembership userMembership = new UserMembership();
                userMembership.setUser(user);
                userMembership.setMembership(membership);
                userMembership.setStartDate(startDate);
                userMembership.setEndDate(endDate);
                userMembership.setStatus("Active");

                UserMembership savedUserMembership = userMembershipRepository.save(userMembership);
                System.out.println("✅ UserMembership activated - ID: " + savedUserMembership.getId() + " until: " + endDate);
            } else {
                System.out.println("⏳ Membership pending payment confirmation via: " + method);
            }

            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("paymentId", savedPayment.getId());
            response.put("paymentStatus", savedPayment.getPaymentStatus());
            response.put("paymentReference", savedPayment.getPaymentReference());
            response.put("paymentDate", savedPayment.getPaymentDate().toString());
            response.put("membershipName", membership.getName());
            response.put("status", paymentStatus.equals("COMPLETED") ? "Active" : "Pending");
            response.put("startDate", startDate.toString());
            response.put("endDate", endDate.toString());

            System.out.println("📤 Sending response: " + response);
            System.out.println("========================================");

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
            System.out.println("📋 Fetching payment history...");

            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Payment> payments = paymentRepository.findByUserId(user.getId());

            System.out.println("✅ Found " + payments.size() + " payments for user: " + user.getEmail());

            return ResponseEntity.ok(ApiResponse.success(payments));

        } catch (Exception e) {
            System.err.println("❌ Error fetching payment history: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("DB-001", "Error fetching payments: " + e.getMessage(), null));
        }
    }

    // Get payment by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Payment>> getPaymentById(@PathVariable Long id) {
        try {
            System.out.println("🔍 Fetching payment by ID: " + id);

            Payment payment = paymentRepository.findById(id)
                    .orElse(null);

            if (payment == null) {
                System.out.println("⚠️ Payment not found with ID: " + id);
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("DB-001", "Payment not found with id: " + id, null));
            }

            System.out.println("✅ Payment found: " + payment.getPaymentReference());
            return ResponseEntity.ok(ApiResponse.success(payment));

        } catch (Exception e) {
            System.err.println("❌ Error fetching payment: " + e.getMessage());
            e.printStackTrace();
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
            System.out.println("👑 Admin fetching all payments...");

            List<Payment> payments = paymentRepository.findAll();

            System.out.println("✅ Found " + payments.size() + " total payments");

            return ResponseEntity.ok(ApiResponse.success(payments));

        } catch (Exception e) {
            System.err.println("❌ Error fetching all payments: " + e.getMessage());
            e.printStackTrace();
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
            System.out.println("📊 Admin fetching payment statistics...");

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

            System.out.println("✅ Stats: Total Payments=" + totalPayments + ", Revenue=₱" + totalRevenue);

            return ResponseEntity.ok(ApiResponse.success(stats));

        } catch (Exception e) {
            System.err.println("❌ Error fetching payment stats: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("DB-001", "Error fetching stats: " + e.getMessage(), null));
        }
    }
}