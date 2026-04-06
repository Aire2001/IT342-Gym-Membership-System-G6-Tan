package edu.cit.tan.GymMembershipPaymentSystem.service.payment;

import edu.cit.tan.GymMembershipPaymentSystem.entity.Payment;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class MayaPaymentStrategy implements PaymentStrategy {

    @Override
    public Payment processPayment(Payment payment, Map<String, Object> paymentDetails) {
        // Implement Maya Wallet specific processing
        System.out.println("Processing payment using MAYA");
        payment.setPaymentStatus("COMPLETED");
        return payment;
    }

    @Override
    public String getPaymentMethod() {
        return "MAYA";
    }
}
