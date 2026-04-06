package edu.cit.tan.GymMembershipPaymentSystem.service.payment;

import edu.cit.tan.GymMembershipPaymentSystem.entity.Payment;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class GCashPaymentStrategy implements PaymentStrategy {

    @Override
    public Payment processPayment(Payment payment, Map<String, Object> paymentDetails) {
        // Implement GCash specific processing logic, API calls...
        System.out.println("Processing payment using GCash");
        payment.setPaymentStatus("COMPLETED");
        return payment;
    }

    @Override
    public String getPaymentMethod() {
        return "GCASH";
    }
}
