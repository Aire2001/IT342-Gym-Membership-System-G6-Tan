package edu.cit.tan.GymMembershipPaymentSystem.shared.repository;

import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, Long> {
    // Find membership by name
    Membership findByName(String name);
}