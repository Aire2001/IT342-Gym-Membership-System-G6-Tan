package edu.cit.tan.GymMembershipPaymentSystem.service.payment;

import edu.cit.tan.GymMembershipPaymentSystem.entity.Payment;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class CardPaymentStrategy implements PaymentStrategy {

    @Override
    public Payment processPayment(Payment payment, Map<String, Object> paymentDetails) {
        // Implement Credit/Debit Card processing logic (e.g., Stripe, Maya Gateway)
        System.out.println("Processing payment using CREDIT/DEBIT CARD");
        payment.setPaymentStatus("COMPLETED");
        return payment;
    }

    @Override
    public String getPaymentMethod() {
        return "CARD";
    }
}
