package edu.cit.tan.GymMembershipPaymentSystem.feature.payment;

import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import edu.cit.tan.GymMembershipPaymentSystem.shared.dto.ApiResponse;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.Membership;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.Payment;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.UserMembership;
import edu.cit.tan.GymMembershipPaymentSystem.shared.repository.MembershipRepository;
import edu.cit.tan.GymMembershipPaymentSystem.shared.repository.PaymentRepository;
import edu.cit.tan.GymMembershipPaymentSystem.shared.repository.UserMembershipRepository;
import edu.cit.tan.GymMembershipPaymentSystem.shared.repository.UserRepository;
import edu.cit.tan.GymMembershipPaymentSystem.shared.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments/stripe")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class StripeController {

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    @Autowired private PaymentRepository paymentRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private MembershipRepository membershipRepository;
    @Autowired private UserMembershipRepository userMembershipRepository;
    @Autowired private EmailService emailService;

    @PostMapping("/create-session")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, String>>> createCheckoutSession(
            @RequestBody Map<String, Object> body) {
        try {
            Stripe.apiKey = stripeSecretKey;

            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Long membershipId = Long.valueOf(body.get("membershipId").toString());
            String paymentMethod = body.getOrDefault("paymentMethod", "Credit Card").toString();

            Membership membership = membershipRepository.findById(membershipId)
                    .orElseThrow(() -> new RuntimeException("Membership not found"));

            // Stripe requires amount in smallest currency unit (centavos for PHP)
            long amountCentavos = membership.getPrice()
                    .multiply(new BigDecimal("100")).longValue();

            String durationLabel = membership.getDurationMonths() + " month"
                    + (membership.getDurationMonths() == 1 ? "" : "s") + " membership";

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl("http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl("http://localhost:5173/memberships")
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency("php")
                                    .setUnitAmount(amountCentavos)
                                    .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName("FitLife Gym – " + membership.getName())
                                            .setDescription(durationLabel)
                                            .build())
                                    .build())
                            .build())
                    .putMetadata("userId", user.getId().toString())
                    .putMetadata("membershipId", membershipId.toString())
                    .build();

            Session session = Session.create(params);

            // Save PENDING payment record linked to this Stripe session
            String reference = "PAY-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"))
                    + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

            Payment payment = new Payment();
            payment.setUser(user);
            payment.setMembership(membership);
            payment.setAmount(membership.getPrice());
            payment.setPaymentMethod(paymentMethod);
            payment.setPaymentStatus("PENDING");
            payment.setPaymentReference(reference);
            payment.setStripeSessionId(session.getId());
            payment.setPaymentDate(LocalDateTime.now());
            paymentRepository.save(payment);

            Map<String, String> response = new HashMap<>();
            response.put("sessionUrl", session.getUrl());
            response.put("sessionId", session.getId());

            System.out.println("✅ Stripe session created: " + session.getId());
            return ResponseEntity.ok(ApiResponse.success(response));

        } catch (Exception e) {
            System.err.println("❌ Stripe session error: " + e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("STRIPE-001", "Payment session failed: " + e.getMessage(), null));
        }
    }

    @GetMapping("/verify")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyPayment(
            @RequestParam String sessionId) {
        try {
            Stripe.apiKey = stripeSecretKey;

            Session session = Session.retrieve(sessionId);

            Payment payment = paymentRepository.findByStripeSessionId(sessionId)
                    .orElseThrow(() -> new RuntimeException("Payment not found for session: " + sessionId));

            Map<String, Object> response = new HashMap<>();

            if ("paid".equals(session.getPaymentStatus()) && !"COMPLETED".equals(payment.getPaymentStatus())) {
                payment.setPaymentStatus("COMPLETED");
                paymentRepository.save(payment);

                User user = payment.getUser();
                Membership membership = payment.getMembership();

                // Cancel any existing active membership
                userMembershipRepository.findByUserAndStatus(user, "Active").ifPresent(old -> {
                    old.setStatus("Cancelled");
                    userMembershipRepository.save(old);
                });

                // Activate new membership
                UserMembership um = new UserMembership();
                um.setUser(user);
                um.setMembership(membership);
                um.setStartDate(LocalDateTime.now());
                um.setEndDate(LocalDateTime.now().plusMonths(membership.getDurationMonths()));
                um.setStatus("Active");
                userMembershipRepository.save(um);

                emailService.sendPaymentReceipt(user, payment, membership);
                System.out.println("✅ Stripe payment verified and membership activated");
            }

            response.put("paymentStatus", payment.getPaymentStatus());
            response.put("paymentReference", payment.getPaymentReference());
            response.put("membershipName", payment.getMembershipName());
            response.put("amount", payment.getAmount());
            response.put("stripeStatus", session.getPaymentStatus());

            return ResponseEntity.ok(ApiResponse.success(response));

        } catch (Exception e) {
            System.err.println("❌ Stripe verify error: " + e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("STRIPE-002", "Verification failed: " + e.getMessage(), null));
        }
    }
}
