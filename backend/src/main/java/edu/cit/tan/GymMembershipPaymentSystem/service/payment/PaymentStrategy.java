package edu.cit.tan.GymMembershipPaymentSystem.service.payment;

import edu.cit.tan.GymMembershipPaymentSystem.entity.Payment;
import java.util.Map;

// Behavioral: Strategy Pattern Interface
public interface PaymentStrategy {
    Payment processPayment(Payment payment, Map<String, Object> paymentDetails);
    String getPaymentMethod();
}
