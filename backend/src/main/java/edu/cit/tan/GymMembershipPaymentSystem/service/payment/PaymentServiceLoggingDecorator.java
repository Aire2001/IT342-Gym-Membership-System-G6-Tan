package edu.cit.tan.GymMembershipPaymentSystem.service.payment;

import edu.cit.tan.GymMembershipPaymentSystem.dto.PaymentRequest;
import edu.cit.tan.GymMembershipPaymentSystem.entity.Payment;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.Map;

// Structural: Decorator Pattern
@Service
@Primary
public class PaymentServiceLoggingDecorator implements PaymentService {

    private final PaymentService delegate;

    public PaymentServiceLoggingDecorator(@Qualifier("paymentServiceCore") PaymentService delegate) {
        this.delegate = delegate;
    }

    @Override
    public Map<String, Object> processPayment(PaymentRequest request, String userEmail) {
        System.out.println("📝 [DECORATOR] Starting payment processing for user: " + userEmail);
        long startTime = System.currentTimeMillis();

        try {
            Map<String, Object> response = delegate.processPayment(request, userEmail);
            long duration = System.currentTimeMillis() - startTime;
            System.out.println("📝 [DECORATOR] Payment successfully processed in " + duration + "ms for user: " + userEmail);
            return response;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            System.err.println("❌ [DECORATOR] Payment failed after " + duration + "ms for user " + userEmail + ". Error: " + e.getMessage());
            throw e;
        }
    }

    @Override
    public Payment getPaymentById(Long id) {
        return delegate.getPaymentById(id);
    }
}
