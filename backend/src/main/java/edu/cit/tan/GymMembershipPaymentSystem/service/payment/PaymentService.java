package edu.cit.tan.GymMembershipPaymentSystem.service.payment;

import edu.cit.tan.GymMembershipPaymentSystem.dto.PaymentRequest;
import edu.cit.tan.GymMembershipPaymentSystem.entity.Payment;
import java.util.Map;

// Structural: Facade Pattern Interface
public interface PaymentService {
    Map<String, Object> processPayment(PaymentRequest request, String userEmail);
    Payment getPaymentById(Long id);
}
