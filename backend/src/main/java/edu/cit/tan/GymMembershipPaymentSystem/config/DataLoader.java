package edu.cit.tan.GymMembershipPaymentSystem.config;

import edu.cit.tan.GymMembershipPaymentSystem.entity.Membership;
import edu.cit.tan.GymMembershipPaymentSystem.repository.MembershipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private MembershipRepository membershipRepository;

    @Override
    public void run(String... args) throws Exception {
        // Add sample memberships if none exist
        if (membershipRepository.count() == 0) {
            Membership basic = new Membership(
                    "Basic",
                    1,
                    new BigDecimal("1500"),
                    "Access to gym facilities during regular hours"
            );

            Membership premium = new Membership(
                    "Premium",
                    6,
                    new BigDecimal("7500"),
                    "Access to gym facilities, group classes, and personal training sessions"
            );

            Membership annual = new Membership(
                    "Annual",
                    12,
                    new BigDecimal("12000"),
                    "Full access to all facilities, classes, and priority booking"
            );

            membershipRepository.save(basic);
            membershipRepository.save(premium);
            membershipRepository.save(annual);

            System.out.println("Sample memberships created!");
        }
    }
}