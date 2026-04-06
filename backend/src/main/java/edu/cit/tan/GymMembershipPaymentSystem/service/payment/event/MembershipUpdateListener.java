package edu.cit.tan.GymMembershipPaymentSystem.service.payment.event;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

// Behavioral: Observer Pattern
@Component
public class MembershipUpdateListener {

    @EventListener
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        System.out.println("🔔 [OBSERVER] PaymentCompletedEvent received for Payment ID: " + event.getPayment().getId());
        System.out.println("🔔 [OBSERVER] Updating Membership Status for User: " + event.getPayment().getUser().getEmail());
        // In a real scenario, we would activate the membership status here
        // e.g., membershipService.activate(event.getPayment().getMembership().getId(), event.getPayment().getUser().getId());
        System.out.println("🔔 [OBSERVER] Membership active!");
    }
}
