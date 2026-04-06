package edu.cit.tan.GymMembershipPaymentSystem.service.payment;

import edu.cit.tan.GymMembershipPaymentSystem.dto.PaymentRequest;
import edu.cit.tan.GymMembershipPaymentSystem.entity.Membership;
import edu.cit.tan.GymMembershipPaymentSystem.entity.Payment;
import edu.cit.tan.GymMembershipPaymentSystem.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.repository.MembershipRepository;
import edu.cit.tan.GymMembershipPaymentSystem.repository.PaymentRepository;
import edu.cit.tan.GymMembershipPaymentSystem.repository.UserRepository;
import edu.cit.tan.GymMembershipPaymentSystem.service.payment.event.PaymentCompletedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service("paymentServiceCore")
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final PaymentStrategyFactory paymentStrategyFactory;
    private final ApplicationEventPublisher eventPublisher;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              UserRepository userRepository,
                              MembershipRepository membershipRepository,
                              PaymentStrategyFactory paymentStrategyFactory,
                              ApplicationEventPublisher eventPublisher) {
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.paymentStrategyFactory = paymentStrategyFactory;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public Map<String, Object> processPayment(PaymentRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        Membership membership = membershipRepository.findById(request.getMembershipId())
                .orElseThrow(() -> new RuntimeException("Membership not found: " + request.getMembershipId()));

        String paymentReference = "PAY-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));

        // Application of Builder Pattern
        Payment payment = new Payment.Builder()
                .user(user)
                .membership(membership)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .paymentReference(paymentReference)
                .paymentStatus("PENDING")
                .build();

        // Application of Strategy and Factory Pattern
        PaymentStrategy strategy = paymentStrategyFactory.getStrategy(request.getPaymentMethod());
        payment = strategy.processPayment(payment, new HashMap<>());

        Payment savedPayment = paymentRepository.save(payment);

        // Application of Observer Pattern
        if ("COMPLETED".equals(savedPayment.getPaymentStatus())) {
            eventPublisher.publishEvent(new PaymentCompletedEvent(savedPayment));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("paymentId", savedPayment.getId());
        response.put("paymentStatus", savedPayment.getPaymentStatus());
        response.put("paymentReference", savedPayment.getPaymentReference());
        response.put("paymentDate", savedPayment.getPaymentDate().toString());

        return response;
    }
    
    @Override
    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id).orElse(null);
    }
}
