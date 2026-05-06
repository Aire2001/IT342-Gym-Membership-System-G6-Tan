package edu.cit.tan.GymMembershipPaymentSystem.service.payment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

// Creational: Factory Method Pattern
@Component
public class PaymentStrategyFactory {

    private final Map<String, PaymentStrategy> strategies = new HashMap<>();

    @Autowired
    public PaymentStrategyFactory(List<PaymentStrategy> paymentStrategies) {
        for (PaymentStrategy strategy : paymentStrategies) {
            strategies.put(strategy.getPaymentMethod().toUpperCase(), strategy);
        }
    }

    public PaymentStrategy getStrategy(String paymentMethod) {
        if (paymentMethod == null || paymentMethod.isEmpty()) {
            throw new IllegalArgumentException("Payment method cannot be empty");
        }
        
        PaymentStrategy strategy = strategies.get(paymentMethod.toUpperCase());
        
        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported payment method: " + paymentMethod);
        }
        
        return strategy;
    }
}
