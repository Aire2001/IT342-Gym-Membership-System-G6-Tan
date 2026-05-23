package edu.cit.tan.GymMembershipPaymentSystem.shared.repository;

import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserId(Long userId);
    Optional<Payment> findByStripeSessionId(String stripeSessionId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Payment p WHERE p.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE Payment p SET p.membership = null WHERE p.membership.id = :membershipId")
    void nullifyMembershipById(@Param("membershipId") Long membershipId);
}