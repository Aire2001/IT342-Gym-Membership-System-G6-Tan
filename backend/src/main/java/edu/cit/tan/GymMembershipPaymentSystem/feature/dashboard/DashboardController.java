package edu.cit.tan.GymMembershipPaymentSystem.feature.dashboard;

import edu.cit.tan.GymMembershipPaymentSystem.shared.dto.ApiResponse;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.Payment;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.UserMembership;
import edu.cit.tan.GymMembershipPaymentSystem.shared.repository.PaymentRepository;
import edu.cit.tan.GymMembershipPaymentSystem.shared.repository.UserMembershipRepository;
import edu.cit.tan.GymMembershipPaymentSystem.shared.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/dashboard")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class DashboardController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserMembershipRepository userMembershipRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        try {
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();

            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Optional<UserMembership> activeMembership =
                    userMembershipRepository.findByUserAndStatus(user, "Active");

            if (activeMembership.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success(null));
            }

            UserMembership um = activeMembership.get();
            List<Payment> payments = paymentRepository.findByUserId(user.getId());

            Payment lastPayment = payments.isEmpty() ? null : payments.get(payments.size() - 1);
            String lastPaymentStatus = lastPayment != null ? lastPayment.getPaymentStatus() : "N/A";

            double totalSpent = payments.stream()
                    .filter(p -> "COMPLETED".equals(p.getPaymentStatus()))
                    .mapToDouble(p -> p.getAmount().doubleValue())
                    .sum();

            Map<String, Object> data = new HashMap<>();
            data.put("membershipStatus", um.getStatus());
            data.put("membershipName", um.getMembership().getName());
            data.put("membershipPrice", um.getMembership().getPrice());
            data.put("membershipDurationMonths", um.getMembership().getDurationMonths());
            data.put("membershipDescription", um.getMembership().getDescription());
            data.put("startDate", um.getStartDate().toString());
            data.put("expirationDate", um.getEndDate().toString());
            data.put("paymentStatus", lastPaymentStatus);
            data.put("totalSpent", totalSpent);
            data.put("totalPayments", payments.size());

            if (lastPayment != null) {
                data.put("lastPaymentDate", lastPayment.getPaymentDate().toString());
                data.put("paymentReference", lastPayment.getPaymentReference());
            }

            return ResponseEntity.ok(ApiResponse.success(data));

        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.success(null));
        }
    }
}
