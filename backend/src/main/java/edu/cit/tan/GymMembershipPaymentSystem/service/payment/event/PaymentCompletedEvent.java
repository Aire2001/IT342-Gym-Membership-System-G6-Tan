package edu.cit.tan.GymMembershipPaymentSystem.service.payment.event;

import edu.cit.tan.GymMembershipPaymentSystem.entity.Payment;

public class PaymentCompletedEvent {
    private final Payment payment;

    public PaymentCompletedEvent(Payment payment) {
        this.payment = payment;
    }

    public Payment getPayment() {
        return payment;
    }
}
