package edu.cit.tan.GymMembershipPaymentSystem.config;

import edu.cit.tan.GymMembershipPaymentSystem.entity.Membership;
import edu.cit.tan.GymMembershipPaymentSystem.repository.MembershipRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

/**
 * Seeds the database with default membership plans on startup if none exist.
 * Plans match the SDD specification: Basic, Premium, Annual.
 */
@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initMemberships(MembershipRepository membershipRepository) {
        return args -> {
            if (membershipRepository.count() == 0) {
                System.out.println("🌱 Seeding default membership plans...");

                List<Membership> plans = List.of(
                    new Membership(
                        "Basic",
                        1,
                        new BigDecimal("1500.00"),
                        "Access to gym facilities during regular hours"
                    ),
                    new Membership(
                        "Premium",
                        6,
                        new BigDecimal("7500.00"),
                        "Access to gym facilities, group classes, and personal training sessions"
                    ),
                    new Membership(
                        "Annual",
                        12,
                        new BigDecimal("12000.00"),
                        "Full access to all facilities, classes, and priority booking"
                    )
                );

                membershipRepository.saveAll(plans);
                System.out.println("✅ Membership plans seeded: Basic (₱1,500/1mo), Premium (₱7,500/6mo), Annual (₱12,000/12mo)");
            } else {
                System.out.println("✅ Membership plans already exist, skipping seed.");
            }
        };
    }
}
